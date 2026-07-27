import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";

const UpdateSlideSchema = z.object({
  title:      z.string().min(1).optional(),
  titleAr:    z.string().optional(),
  subtitle:   z.string().nullable().optional(),
  subtitleAr: z.string().nullable().optional(),
  imageUrl:   z.string().url().optional(),
  ctaLabel:   z.string().nullable().optional(),
  ctaLabelAr: z.string().nullable().optional(),
  ctaLink:    z.string().nullable().optional(),
  sortOrder:  z.number().int().optional(),
  isActive:   z.boolean().optional(),
  startsAt:   z.string().datetime().nullable().optional(),
  endsAt:     z.string().datetime().nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/slides/[id]
export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as Ctx).params;

  const slide = await prisma.slide.findUnique({ where: { id } });
  if (!slide) return apiError(ErrorCodes.NOT_FOUND, "Slide not found", 404);
  return apiSuccess(slide);
});

// PUT /api/admin/slides/[id]
export const PUT = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as Ctx).params;

  const body = await req.json();
  const data = UpdateSlideSchema.parse(body);

  const slide = await prisma.slide.findUnique({ where: { id } });
  if (!slide) return apiError(ErrorCodes.NOT_FOUND, "Slide not found", 404);

  const updated = await prisma.slide.update({
    where: { id },
    data: {
      ...data,
      startsAt: data.startsAt !== undefined ? (data.startsAt ? new Date(data.startsAt) : null) : undefined,
      endsAt:   data.endsAt   !== undefined ? (data.endsAt   ? new Date(data.endsAt)   : null) : undefined,
    },
  });

  return apiSuccess(updated);
});

// DELETE /api/admin/slides/[id]
export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as Ctx).params;

  const slide = await prisma.slide.findUnique({ where: { id } });
  if (!slide) return apiError(ErrorCodes.NOT_FOUND, "Slide not found", 404);

  await prisma.slide.delete({ where: { id } });
  return apiSuccess({ message: "Slide deleted" });
});
