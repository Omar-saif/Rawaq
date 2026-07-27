import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler } from "@/lib/utils/api";

// GET /api/promo-posters (public)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const now = new Date();
  const posters = await prisma.promoPoster.findMany({
    where: {
      isActive: true,
      OR: [
        { startsAt: null, endsAt: null },
        { startsAt: { lte: now }, endsAt: null },
        { startsAt: null, endsAt: { gte: now } },
        { startsAt: { lte: now }, endsAt: { gte: now } },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });

  return apiSuccess(posters);
});
