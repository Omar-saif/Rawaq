import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler, parsePagination, paginationMeta } from "@/lib/utils/api";
import { Prisma } from "@prisma/client";

// GET /api/search?q=&page=&pageSize=
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const { page, pageSize, skip } = parsePagination(searchParams);

  if (!q || q.length < 2) {
    return apiSuccess([], paginationMeta(0, page, pageSize));
  }

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { titleAr: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ],
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip, take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, titleAr: true, slug: true, sku: true,
        images: true, price: true, salePrice: true,
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return apiSuccess(products, paginationMeta(total, page, pageSize));
});
