/**
 * Server-side data fetching functions using Prisma directly.
 * These replace the fetch(`${NEXT_PUBLIC_APP_URL}/api/...`) pattern
 * which fails on Vercel because NEXT_PUBLIC_APP_URL points to localhost.
 *
 * Use these functions ONLY in Server Components / Route Handlers.
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: {
        children: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            nameAr: true,
            slug: true,
            parentId: true,
          },
        },
      },
    });
    return categories;
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    // Check top-level first
    let category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          select: { id: true, name: true, nameAr: true, slug: true },
        },
      },
    });
    return category ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const SortOptions = ["price_asc", "price_desc", "newest"] as const;
type SortOption = (typeof SortOptions)[number];

export async function getProductBySlug(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          include: { parent: { select: { id: true, name: true, slug: true } } },
        },
        variants: {
          orderBy: [{ variantType: "asc" }, { value: "asc" }],
        },
      },
    });
    if (!product || !product.isActive) return null;
    return product;
  } catch {
    return null;
  }
}

interface GetProductsOptions {
  categorySlug?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  attribute?: string | string[];
  page?: number;
  pageSize?: number;
}

export async function getProducts(options: GetProductsOptions = {}) {
  const {
    categorySlug,
    categoryId,
    minPrice,
    maxPrice,
    sort = "newest",
    attribute,
    page = 1,
    pageSize = 24,
  } = options;

  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  // Category filter by slug (supports parent + children)
  if (categorySlug) {
    const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (cat) {
      const children = await prisma.category.findMany({
        where: { parentId: cat.id },
        select: { id: true },
      });
      where.categoryId = { in: [cat.id, ...children.map((c) => c.id)] };
    }
  } else if (categoryId) {
    const children = await prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });
    where.categoryId = { in: [categoryId, ...children.map((c) => c.id)] };
  }

  // Attribute filter
  if (attribute) {
    const attrs = Array.isArray(attribute) ? attribute : [attribute];
    const andConditions = attrs
      .map((attr) => {
        const [attrType, attrValue] = attr.split(":");
        if (attrType && attrValue) {
          return { variants: { some: { variantType: attrType, value: attrValue } } };
        }
        return null;
      })
      .filter(Boolean) as Prisma.ProductWhereInput[];

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : { createdAt: "desc" };

  try {
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
            select: {
              id: true,
              variantType: true,
              value: true,
              stockCount: true,
              priceModifier: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    // Normalize Prisma Decimal → number so it satisfies ProductCardData's price: string | number
    const normalized = products.map((p) => ({
      ...p,
      price: parseFloat(p.price.toString()),
      salePrice: p.salePrice ? parseFloat(p.salePrice.toString()) : null,
      variants: p.variants.map((v) => ({
        ...v,
        priceModifier: v.priceModifier ? parseFloat(v.priceModifier.toString()) : null,
      })),
    }));
    return { products: normalized, total, totalPages };
  } catch {
    return { products: [], total: 0, totalPages: 1 };
  }
}

export async function getRelatedProducts(categoryId: string, currentSlug: string, limit = 4) {
  try {
    const { products } = await getProducts({ categoryId, pageSize: limit + 1 });
    return products
      .filter((p) => p.slug !== currentSlug)
      .slice(0, limit);
  } catch {
    return [];
  }
}
