import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler } from "@/lib/utils/api";

// GET /api/categories — returns full category tree with attributeSchema
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const topLevel = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true, name: true, nameAr: true, slug: true,
          imageUrl: true, attributeSchema: true, sortOrder: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
      },
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });

  return apiSuccess(topLevel);
});
