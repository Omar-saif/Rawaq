import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler, parsePagination, paginationMeta } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";
import { Prisma } from "@prisma/client";

const ProductSchema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional().default(""),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  sku: z.string().min(1),
  description: z.string().optional().default(""),
  descriptionAr: z.string().optional().default(""),
  categoryId: z.string().min(1),
  images: z.array(z.string().url()).min(1, "At least one image required"),
  price: z.number().positive(),
  salePrice: z.number().positive().nullable().optional(),
  inventoryCount: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  variants: z.array(z.object({
    variantType: z.string().min(1),
    value: z.string().min(1),
    skuSuffix: z.string().min(1),
    stockCount: z.number().int().min(0),
    priceModifier: z.number().nullable().optional(),
  })).optional().default([]),
});

// GET /api/admin/products
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const { page, pageSize, skip } = parsePagination(searchParams);
  const search = searchParams.get("search");
  const categoryId = searchParams.get("categoryId");
  const isActive = searchParams.get("isActive");

  const where: Prisma.ProductWhereInput = {
    ...(search ? {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(isActive !== null ? { isActive: isActive === "true" } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip, take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: true,
        _count: { select: { orderItems: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return apiSuccess(products, paginationMeta(total, page, pageSize));
});

// POST /api/admin/products
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();
  const data = ProductSchema.parse(body);

  // Validate category exists
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return apiError(ErrorCodes.NOT_FOUND, "Category not found", 404);

  const product = await prisma.product.create({
    data: {
      title: data.title, titleAr: data.titleAr, slug: data.slug, sku: data.sku,
      description: data.description, descriptionAr: data.descriptionAr,
      categoryId: data.categoryId, images: data.images,
      price: data.price, salePrice: data.salePrice ?? null,
      inventoryCount: data.inventoryCount, isActive: data.isActive,
      variants: { create: data.variants },
    },
    include: { variants: true, category: true },
  });

  return apiSuccess(product, undefined, 201);
});
