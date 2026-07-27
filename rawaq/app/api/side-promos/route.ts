import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler } from "@/lib/utils/api";

// GET /api/side-promos?pageType=...
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const pageType = searchParams.get("pageType");

  const now = new Date();
  
  const whereClause: any = {
    isActive: true,
    OR: [
      { startsAt: null, endsAt: null },
      { startsAt: { lte: now }, endsAt: null },
      { startsAt: null, endsAt: { gte: now } },
      { startsAt: { lte: now }, endsAt: { gte: now } },
    ],
  };

  if (pageType) {
    whereClause.targetPages = {
      has: pageType,
    };
  }

  const promos = await prisma.sidePromo.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(promos);
});
