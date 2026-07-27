import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler, parsePagination, paginationMeta } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";

const SlideSchema = z.object({
  title:       z.string().min(1, "Title is required"),
  titleAr:     z.string().default(""),
  subtitle:    z.string().nullable().optional(),
  subtitleAr:  z.string().nullable().optional(),
  imageUrl:    z.string().url("Must be a valid URL"),
  ctaLabel:    z.string().nullable().optional(),
  ctaLabelAr:  z.string().nullable().optional(),
  ctaLink:     z.string().nullable().optional(),
  sortOrder:   z.number().int().default(0),
  isActive:    z.boolean().default(true),
  startsAt:    z.string().datetime().nullable().optional(),
  endsAt:      z.string().datetime().nullable().optional(),
});

// GET /api/admin/slides — all slides (admin), paginated
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const { page, pageSize, skip } = parsePagination(searchParams);

  const [slides, total] = await Promise.all([
    prisma.slide.findMany({
      skip, take: pageSize,
      orderBy: { sortOrder: "asc" },
    }),
    prisma.slide.count(),
  ]);

  return apiSuccess(slides, paginationMeta(total, page, pageSize));
});

// POST /api/admin/slides — create a new slide
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();
  const data = SlideSchema.parse(body);

  const slide = await prisma.slide.create({
    data: {
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt:   data.endsAt   ? new Date(data.endsAt)   : null,
    },
  });

  return apiSuccess(slide, undefined, 201);
});
