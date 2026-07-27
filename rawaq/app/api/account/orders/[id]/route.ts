import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAuth } from "@/lib/utils/session";

// GET /api/account/orders/[id]
export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const session = await requireAuth();

  const order = await prisma.order.findFirst({
    where: { id, userId: session.userId },
    include: {
      items: {
        include: {
          product: { select: { title: true, titleAr: true, images: true, slug: true } },
          variant: { select: { variantType: true, value: true } },
        },
      },
      coupon: { select: { code: true, discountType: true, discountValue: true } },
      deliveryVendor: true,
    },
  });

  if (!order) {
    return apiError(ErrorCodes.NOT_FOUND, "Order not found", 404);
  }

  return apiSuccess(order);
});
