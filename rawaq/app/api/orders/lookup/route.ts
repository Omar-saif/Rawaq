import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";

const LookupSchema = z.object({
  orderId: z.string().min(1),
  email: z.string().email(),
});

// GET /api/orders/lookup?orderId=...&email=...
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { orderId, email } = LookupSchema.parse({
    orderId: searchParams.get("orderId"),
    email: searchParams.get("email"),
  });

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { guestEmail: email.toLowerCase() },
        { user: { email: email.toLowerCase() } },
      ],
    },
    include: {
      items: {
        include: {
          product: { select: { title: true, images: true, slug: true } },
          variant: { select: { variantType: true, value: true } },
        },
      },
      coupon: { select: { code: true, discountType: true, discountValue: true } },
      deliveryVendor: true,
    },
  });

  if (!order) return apiError(ErrorCodes.NOT_FOUND, "Order not found", 404);
  return apiSuccess(order);
});
