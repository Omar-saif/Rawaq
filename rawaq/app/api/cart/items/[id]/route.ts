import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";
import { z } from "zod";

const UpdateCartItemSchema = z.object({
  quantity: z.number().int().nonnegative(),
});

// PATCH /api/cart/items/[id]
export const PATCH = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const session = await getSession();
  if (!session) return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const body = await req.json();
  const { quantity } = UpdateCartItemSchema.parse(body);

  const item = await prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });
  if (!item || item.cart.userId !== session.userId) {
    return apiError(ErrorCodes.NOT_FOUND, "Cart item not found", 404);
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  }

  const updated = await prisma.cartItem.update({
    where: { id },
    data: { quantity },
  });

  return apiSuccess(updated);
});

// DELETE /api/cart/items/[id]
export const DELETE = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const session = await getSession();
  if (!session) return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;

  const item = await prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });
  if (!item || item.cart.userId !== session.userId) {
    return apiError(ErrorCodes.NOT_FOUND, "Cart item not found", 404);
  }

  await prisma.cartItem.delete({ where: { id } });
  return apiSuccess({ deleted: true });
});
