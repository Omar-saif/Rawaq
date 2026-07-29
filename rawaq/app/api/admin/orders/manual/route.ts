import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler, ApiException } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";
import { SalesChannel, OrderStatus } from "@prisma/client";

const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default("SA"),
  postalCode: z.string().optional(),
});

const GuestSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1).optional().or(z.literal("")),
  address: AddressSchema.optional(),
});

const CartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().max(99),
});

const ManualOrderSchema = z.object({
  cartItems: z.array(CartItemSchema).min(1),
  channel: z.nativeEnum(SalesChannel),
  status: z.nativeEnum(OrderStatus),
  guest: GuestSchema.optional(),
  linkToUserId: z.string().optional(),
  forceGuest: z.boolean().optional(),
  discountAmount: z.number().min(0).optional(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdmin();
  const body = await req.json();
  const data = ManualOrderSchema.parse(body);

  // 1. Duplicate Detection & Explicit Customer Linking Flow
  if (!data.linkToUserId && !data.forceGuest && data.guest) {
    const { email, phone } = data.guest;
    if (email || phone) {
      // Check for existing User
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (existingUser) {
        return apiError(ErrorCodes.CONFLICT, "User exists with this email or phone.", 409, { userId: existingUser.id, name: existingUser.name });
      }

      // Check for existing Order (Guest)
      const existingOrder = await prisma.order.findFirst({
        where: {
          OR: [
            ...(email ? [{ guestEmail: email }] : []),
            ...(phone ? [{ guestPhone: phone }] : []),
          ],
          userId: null,
        },
      });

      if (existingOrder) {
        return apiError(ErrorCodes.CONFLICT, "A previous guest order exists with this email or phone.", 409);
      }
    }
  }

  // 2. Resolve buyer info
  let userId = data.linkToUserId || undefined;
  let guestEmail = data.guest?.email || undefined;
  let guestPhone = data.guest?.phone || undefined;
  let shippingAddress: any = data.guest?.address || { street: "N/A", city: "N/A", country: "N/A" };

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiException(ErrorCodes.NOT_FOUND, "Linked user not found", 404);
    // Prefer user's details if missing from guest payload
    if (!guestEmail && user.email) guestEmail = user.email;
    if (!guestPhone && user.phone) guestPhone = user.phone;
  }

  // 3. Create Order in Transaction (Reusing exact checkout stock-check logic)
  const order = await prisma.$transaction(async (tx) => {
    let subtotal = 0;
    const resolvedItems: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (const item of data.cartItems) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product || !product.isActive) {
        throw new ApiException(ErrorCodes.NOT_FOUND, `Product not found: ${item.productId}`, 400);
      }

      let unitPrice = parseFloat(product.salePrice?.toString() ?? product.price.toString());

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new ApiException(ErrorCodes.NOT_FOUND, `Variant not found for product: ${product.title}`, 400);
        }
        if (variant.stockCount < item.quantity) {
          throw new ApiException(
            ErrorCodes.OUT_OF_STOCK,
            `"${product.title}" (${variant.value}) only has ${variant.stockCount} in stock. Requested: ${item.quantity}`,
            400
          );
        }
        if (variant.priceModifier) {
          unitPrice = parseFloat(variant.priceModifier.toString());
        }
        // Decrement variant stock atomically
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stockCount: { decrement: item.quantity } },
        });
      } else {
        // No variant — check product inventory
        if (product.inventoryCount < item.quantity) {
          throw new ApiException(
            ErrorCodes.OUT_OF_STOCK,
            `"${product.title}" only has ${product.inventoryCount} in stock. Requested: ${item.quantity}`,
            400
          );
        }
        await tx.product.update({
          where: { id: product.id },
          data: { inventoryCount: { decrement: item.quantity } },
        });
      }

      subtotal += unitPrice * item.quantity;
      resolvedItems.push({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, unitPrice });
    }

    const discountAmount = data.discountAmount || 0;
    const total = Math.max(0, subtotal - discountAmount);

    const newOrder = await tx.order.create({
      data: {
        userId,
        guestEmail,
        guestPhone,
        status: data.status,
        channel: data.channel,
        subtotal,
        discountAmount,
        total,
        shippingAddress: shippingAddress as any,
        items: {
          create: resolvedItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    // 4. Write Audit Log
    await tx.auditLog.create({
      data: {
        adminId: session.userId,
        action: "CREATE_MANUAL_ORDER",
        resource: "Order",
        resourceId: newOrder.id,
        details: {
          channel: data.channel,
          total: total,
          status: data.status,
          itemCount: resolvedItems.reduce((acc, item) => acc + item.quantity, 0),
        } as any,
      },
    });

    return newOrder;
  });

  return apiSuccess({ orderId: order.id, total: order.total }, undefined, 201);
});
