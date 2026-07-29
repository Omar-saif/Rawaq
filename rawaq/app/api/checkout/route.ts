import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler, ApiException } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";
import { sendEmail, getOrderConfirmationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/utils/rateLimit";

const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default("SA"),
  postalCode: z.string().optional(),
});

const GuestSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(1),
  address: AddressSchema,
});

const CartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().max(99),
});

const CheckoutSchema = z.object({
  cartItems: z.array(CartItemSchema).min(1),
  couponCode: z.string().optional(),
  // For guests
  guest: GuestSchema.optional(),
  // For authenticated users
  savedAddressId: z.string().optional(),
  newAddress: AddressSchema.optional(),
  deliveryVendorId: z.string().optional(),
});

// POST /api/checkout
export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  // Max 5 checkouts per 15 minutes per IP
  if (!checkRateLimit(`checkout_${ip}`, 5, 15 * 60 * 1000)) {
    return apiError(ErrorCodes.RATE_LIMIT, "Too many checkout attempts. Please try again later.", 429);
  }

  const body = await req.json();
  const data = CheckoutSchema.parse(body);
  const session = await getSession();

  // Validate identity: must have either session or guest info
  if (!session && !data.guest) {
    return apiError(ErrorCodes.VALIDATION_ERROR, "Guest information is required for guest checkout", 400);
  }

  // Resolve shipping address
  let shippingAddress: { street: string; city: string; country: string; postalCode?: string };

  if (session && data.savedAddressId) {
    const saved = await prisma.address.findFirst({
      where: { id: data.savedAddressId, userId: session.userId },
    });
    if (!saved) {
      return apiError(ErrorCodes.NOT_FOUND, "Saved address not found", 404);
    }
    shippingAddress = {
      street: saved.street,
      city: saved.city,
      country: saved.country,
      postalCode: saved.postalCode ?? undefined,
    };
  } else if (session && data.newAddress) {
    shippingAddress = data.newAddress;
  } else if (data.guest) {
    shippingAddress = data.guest.address;
  } else {
    return apiError(ErrorCodes.VALIDATION_ERROR, "A shipping address is required", 400);
  }

  // Run everything in a Prisma transaction
  const order = await prisma.$transaction(async (tx) => {
    // 1. Validate and fetch all products + variants
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
            `"${product.title}" (${variant.value}) only has ${variant.stockCount} in stock`,
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
            `"${product.title}" only has ${product.inventoryCount} in stock`,
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

    // 2. Validate coupon (re-validates same logic as /api/cart/validate-coupon)
    let discountAmount = 0;
    let couponId: string | undefined;

    let coupon = null;
    if (data.couponCode) {
      coupon = await tx.coupon.findUnique({ where: { code: data.couponCode.toUpperCase() } });
      if (!coupon || !coupon.isActive) throw new ApiException(ErrorCodes.COUPON_INVALID, "Invalid coupon code", 400);
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiException(ErrorCodes.COUPON_EXPIRED, "Coupon has expired", 400);
      if (coupon.timesUsed >= coupon.usageLimit) throw new ApiException(ErrorCodes.COUPON_USAGE_LIMIT, "Coupon usage limit reached", 400);
    }

    if (coupon) {
      if (coupon.minCartValue && subtotal < parseFloat(coupon.minCartValue.toString())) {
        throw new ApiException(ErrorCodes.VALIDATION_ERROR, `Minimum cart value of ${coupon.minCartValue} not met`, 400);
      }
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = subtotal * (parseFloat(coupon.discountValue.toString()) / 100);
      } else {
        discountAmount = parseFloat(coupon.discountValue.toString());
      }
      // Ensure discount doesn't exceed subtotal
      if (discountAmount > subtotal) discountAmount = subtotal;

      // Increment coupon usage
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { timesUsed: { increment: 1 } },
      });
    }

    let shippingCost = 0;
    let validatedVendorId: string | null = null;
    if (data.deliveryVendorId) {
      const vendor = await tx.deliveryVendor.findUnique({ where: { id: data.deliveryVendorId } });
      if (!vendor || !vendor.isActive) {
        throw new ApiException(ErrorCodes.NOT_FOUND, "Selected delivery vendor is invalid or inactive", 400);
      }
      shippingCost = parseFloat(vendor.price.toString());
      validatedVendorId = vendor.id;
    }

    const total = subtotal - discountAmount + shippingCost;

    // 3. Create order
    const newOrder = await tx.order.create({
      data: {
        userId: session?.userId,
        guestEmail: data.guest?.email,
        guestPhone: data.guest?.phone,
        status: "PENDING",
        subtotal,
        discountAmount,
        total,
        couponId: coupon?.id,
        deliveryVendorId: validatedVendorId,
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

    return newOrder;
  });

  // TODO (Phase 11): Replace this stub with SSLCommerz payment initiation
  async function processPayment(_orderId: string): Promise<{ success: boolean }> {
    // Stub: In Phase 11, initiate SSLCommerz session here and return redirect URL
    return { success: true };
  }

  await processPayment(order.id);

  // Send Order Confirmation Email
  const emailTo = session?.email || data.guest?.email;
  if (emailTo) {
    const locale = req.headers.get("x-invoke-path")?.startsWith("/ar") ? "ar" : "en"; // Simple locale guess from header or fallback
    const { subject, html } = getOrderConfirmationEmail(order, locale);
    
    // Fire and forget (don't block checkout response if email fails)
    sendEmail({ to: emailTo, subject, html }).catch(console.error);
  }

  return apiSuccess({ orderId: order.id, total: order.total }, undefined, 201);
});
