import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler } from "@/lib/utils/api";

// GET /api/slides — public endpoint, returns only currently-active slides
// Filters: isActive=true AND (startsAt is null OR startsAt <= now)
//                          AND (endsAt is null OR endsAt >= now)
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const now = new Date();

  const slides = await prisma.slide.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [
        {
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
      ],
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      titleAr: true,
      subtitle: true,
      subtitleAr: true,
      imageUrl: true,
      ctaLabel: true,
      ctaLabelAr: true,
      ctaLink: true,
      sortOrder: true,
    },
  });

  return apiSuccess(slides);
});
