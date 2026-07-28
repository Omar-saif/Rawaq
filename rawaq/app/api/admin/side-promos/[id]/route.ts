import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";

const SidePromoUpdateSchema = z.object({
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  targetPages: z.array(z.string()).min(1).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

// PUT /api/admin/side-promos/[id]
export const PUT = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const { id } = await (ctx.params as Promise<{id: string}>);
  const body = await req.json();
  const data = SidePromoUpdateSchema.parse(body);

  const updated = await prisma.sidePromo.update({
    where: { id },
    data: {
      ...data,
      ...(data.startsAt !== undefined ? { startsAt: data.startsAt ? new Date(data.startsAt) : null } : {}),
      ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
    },
  });

  return apiSuccess(updated);
});

// DELETE /api/admin/side-promos/[id]
export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const { id } = await (ctx.params as Promise<{id: string}>);
  await prisma.sidePromo.delete({ where: { id } });

  return apiSuccess(null);
});
