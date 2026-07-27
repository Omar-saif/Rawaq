import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler, parsePagination, paginationMeta } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";

const CouponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  minCartValue: z.number().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  usageLimit: z.number().int().positive().default(100),
  isActive: z.boolean().default(true),
}).refine((d) => {
  if (d.discountType === "PERCENTAGE" && (d.discountValue < 1 || d.discountValue > 100)) return false;
  return true;
}, { message: "Percentage discount must be between 1 and 100" });

// GET /api/admin/coupons
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const { page, pageSize, skip } = parsePagination(searchParams);
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({ skip, take: pageSize, orderBy: { code: "asc" } }),
    prisma.coupon.count(),
  ]);
  return apiSuccess(coupons, paginationMeta(total, page, pageSize));
});

// POST /api/admin/coupons
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();
  const data = CouponSchema.parse(body);

  if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
    return apiError(ErrorCodes.VALIDATION_ERROR, "Expiry date must be in the future", 400);
  }

  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) return apiError(ErrorCodes.CONFLICT, "Coupon code already exists", 409);

  const coupon = await prisma.coupon.create({
    data: { ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null },
  });
  return apiSuccess(coupon, undefined, 201);
});
