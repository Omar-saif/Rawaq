import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAuth } from "@/lib/utils/session";

const UpdateAddressSchema = z.object({
  street: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/account/addresses/[id]
export const PUT = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const { params } = ctx as Ctx;
  const { id } = await params;
  const session = await requireAuth();
  const body = await req.json();
  const data = UpdateAddressSchema.parse(body);

  // Ensure address belongs to user
  const existing = await prisma.address.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return apiError(ErrorCodes.NOT_FOUND, "Address not found", 404);

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.userId },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.address.update({ where: { id }, data });
  return apiSuccess(updated);
});

// DELETE /api/account/addresses/[id]
export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  const { params } = ctx as Ctx;
  const { id } = await params;
  const session = await requireAuth();

  const existing = await prisma.address.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return apiError(ErrorCodes.NOT_FOUND, "Address not found", 404);

  await prisma.address.delete({ where: { id } });

  // If deleted address was default, promote the oldest remaining
  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: session.userId },
      orderBy: { id: "asc" },
    });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return apiSuccess({ deleted: true });
});
