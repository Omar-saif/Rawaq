import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";

const DeliveryVendorUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  estimatedDays: z.string().min(1).optional(),
  estimatedDaysAr: z.string().optional(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const PUT = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const body = await req.json();
  const data = DeliveryVendorUpdateSchema.parse(body);

  const updated = await prisma.deliveryVendor.update({
    where: { id },
    data,
  });

  return apiSuccess(updated);
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  await prisma.deliveryVendor.delete({ where: { id } });

  return apiSuccess(null);
});
