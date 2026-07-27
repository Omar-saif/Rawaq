import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";

const UpdateCouponSchema = z.object({
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().positive().optional(),
  minCartValue: z.number().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { params } = ctx as Ctx;
  const { id } = await params;
  const body = await req.json();
  const data = UpdateCouponSchema.parse(body);

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return apiError(ErrorCodes.NOT_FOUND, "Coupon not found", 404);

  const updated = await prisma.coupon.update({
    where: { id },
    data: { ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : data.expiresAt === null ? null : undefined },
  });
  return apiSuccess(updated);
});

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { params } = ctx as Ctx;
  const { id } = await params;

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return apiError(ErrorCodes.NOT_FOUND, "Coupon not found", 404);

  await prisma.coupon.delete({ where: { id } });
  return apiSuccess({ deleted: true });
});
