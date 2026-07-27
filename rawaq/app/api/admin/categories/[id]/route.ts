import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";

const UpdateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  attributeSchema: z.array(z.object({
    key: z.string(), label: z.string(), labelAr: z.string().optional(),
    type: z.enum(["text","select","multiselect","range","boolean"]),
    options: z.array(z.string()).optional(), unit: z.string().optional(),
  })).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/admin/categories/[id]
export const PUT = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { params } = ctx as Ctx;
  const { id } = await params;
  const body = await req.json();
  const data = UpdateCategorySchema.parse(body);

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return apiError(ErrorCodes.NOT_FOUND, "Category not found", 404);

  // Circular relationship check
  if (data.parentId && data.parentId !== existing.parentId) {
    if (data.parentId === id) return apiError(ErrorCodes.VALIDATION_ERROR, "A category cannot be its own parent", 400);
    const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent) return apiError(ErrorCodes.NOT_FOUND, "Parent category not found", 404);
    if (parent.parentId === id) return apiError(ErrorCodes.VALIDATION_ERROR, "Circular category relationship detected", 400);
  }

  const updated = await prisma.category.update({ where: { id }, data: { ...data, parentId: data.parentId ?? undefined } });
  return apiSuccess(updated);
});

// DELETE /api/admin/categories/[id]
export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { params } = ctx as Ctx;
  const { id } = await params;

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!existing) return apiError(ErrorCodes.NOT_FOUND, "Category not found", 404);
  if (existing._count.products > 0) return apiError(ErrorCodes.CONFLICT, "Cannot delete category with products", 409);
  if (existing._count.children > 0) return apiError(ErrorCodes.CONFLICT, "Cannot delete category with subcategories", 409);

  await prisma.category.delete({ where: { id } });
  return apiSuccess({ deleted: true });
});
