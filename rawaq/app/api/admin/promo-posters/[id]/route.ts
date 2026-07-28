import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";

const PromoPosterUpdateSchema = z.object({
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

// PUT /api/admin/promo-posters/[id]
export const PUT = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const body = await req.json();
  const data = PromoPosterUpdateSchema.parse(body);

  const updated = await prisma.promoPoster.update({
    where: { id },
    data: {
      ...data,
      ...(data.startsAt !== undefined ? { startsAt: data.startsAt ? new Date(data.startsAt) : null } : {}),
      ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
    },
  });

  return apiSuccess(updated);
});

// DELETE /api/admin/promo-posters/[id]
export const DELETE = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  await prisma.promoPoster.delete({ where: { id } });

  return apiSuccess(null);
});
