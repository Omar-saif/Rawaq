import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";
import { z } from "zod";

const CartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
});

// POST /api/cart/items
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session) return apiError(ErrorCodes.UNAUTHORIZED, "Please log in to add items to cart", 401);

  const body = await req.json();
  const { productId, variantId, quantity } = CartItemSchema.parse(body);

  // Get or create cart
  let cart = await prisma.cart.findUnique({ where: { userId: session.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: session.id } });
  }

  // Check existing item
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_variantId: {
        cartId: cart.id,
        productId,
        variantId: variantId ?? null!, // Handling nullable string for unique constraint can be tricky. We might just query it first.
      }
    }
  });

  // A safer manual check for nullable fields in unique constraint
  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId ?? null },
  });

  if (item) {
    const updated = await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: item.quantity + quantity },
    });
    return apiSuccess(updated);
  } else {
    const created = await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId: variantId ?? null, quantity },
    });
    return apiSuccess(created);
  }
});
