import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { Decimal } from "@prisma/client/runtime/library";

const ValidateCouponSchema = z.object({
  code: z.string().min(1),
  cartSubtotal: z.number().positive(),
  cartItems: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().int().positive(),
    })
  ),
});

// POST /api/cart/validate-coupon
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { code, cartSubtotal } = ValidateCouponSchema.parse(body);

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.isActive) {
    return apiError(ErrorCodes.COUPON_INVALID, "Coupon code is invalid", 400);
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return apiError(ErrorCodes.COUPON_EXPIRED, "This coupon has expired", 400);
  }

  if (coupon.timesUsed >= coupon.usageLimit) {
    return apiError(ErrorCodes.COUPON_USAGE_LIMIT, "This coupon has reached its usage limit", 400);
  }

  const minCartValue = coupon.minCartValue ? parseFloat(coupon.minCartValue.toString()) : null;
  if (minCartValue !== null && cartSubtotal < minCartValue) {
    return apiError(
      ErrorCodes.COUPON_MIN_CART,
      `Minimum cart value of ${minCartValue} SAR required for this coupon`,
      400
    );
  }

  // Calculate discount server-side (never trust client)
  let discountAmount: number;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = parseFloat(
      ((cartSubtotal * parseFloat(coupon.discountValue.toString())) / 100).toFixed(2)
    );
  } else {
    discountAmount = Math.min(
      parseFloat(coupon.discountValue.toString()),
      cartSubtotal
    );
  }

  const newTotal = parseFloat((cartSubtotal - discountAmount).toFixed(2));

  return apiSuccess({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: parseFloat(coupon.discountValue.toString()),
    },
    discountAmount,
    newTotal,
  });
});
