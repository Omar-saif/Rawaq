import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler, parsePagination, paginationMeta } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";
import { Prisma } from "@prisma/client";

const SortOptions = ["price_asc", "price_desc", "newest"] as const;

// GET /api/products
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  // Parse filters
  const categorySlug = searchParams.get("categorySlug");
  const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
  const sort = (searchParams.get("sort") ?? "newest") as (typeof SortOptions)[number];
  const attribute = searchParams.get("attribute"); // e.g. "size:52" or "scent_family:Oud"

  const { page, pageSize, skip } = parsePagination(searchParams);

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    ...(!isAdmin ? { isActive: true } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  // Category filter (support parent or child slug)
  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (category) {
      const childCategories = await prisma.category.findMany({
        where: { parentId: category.id },
        select: { id: true },
      });
      const categoryIds = [category.id, ...childCategories.map((c) => c.id)];
      where.categoryId = { in: categoryIds };
    }
  }

  // Attribute filter (stored in variants)
  // e.g. attribute=size:52 → filter by variant with variantType=size AND value=52
  if (attribute) {
    const [attrType, attrValue] = attribute.split(":");
    if (attrType && attrValue) {
      where.variants = {
        some: { variantType: attrType, value: attrValue },
      };
    }
  }

  // Sort
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        titleAr: true,
        slug: true,
        sku: true,
        images: true,
        price: true,
        salePrice: true,
        inventoryCount: true,
        isActive: true,
        createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          select: { id: true, variantType: true, value: true, stockCount: true, priceModifier: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return apiSuccess(products, paginationMeta(total, page, pageSize));
});
