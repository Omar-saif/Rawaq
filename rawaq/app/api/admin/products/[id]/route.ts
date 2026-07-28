import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";

const UpdateProductSchema = z.object({
  title: z.string().min(1).optional(),
  titleAr: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  categoryId: z.string().optional(),
  images: z.array(z.string()).optional(),
  price: z.coerce.number().positive().optional(),
  salePrice: z.coerce.number().positive().nullable().optional(),
  inventoryCount: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  variants: z.array(z.object({
    id: z.string().optional(),
    variantType: z.string().min(1),
    value: z.string().min(1),
    skuSuffix: z.string().min(1),
    stockCount: z.coerce.number().int().min(0),
    priceModifier: z.coerce.number().nullable().optional(),
  })).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/admin/products/[id]
export const PUT = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { params } = ctx as Ctx;
  const { id } = await params;
  const body = await req.json();
  const data = UpdateProductSchema.parse(body);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return apiError(ErrorCodes.NOT_FOUND, "Product not found", 404);

  if (data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!cat) return apiError(ErrorCodes.NOT_FOUND, "Category not found", 404);
  }

  const updated = await prisma.product.update({ where: { id }, data, include: { variants: true } });
  return apiSuccess(updated);
});

// DELETE /api/admin/products/[id]
export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { params } = ctx as Ctx;
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return apiError(ErrorCodes.NOT_FOUND, "Product not found", 404);

  await prisma.product.delete({ where: { id } });
  return apiSuccess({ deleted: true });
});
