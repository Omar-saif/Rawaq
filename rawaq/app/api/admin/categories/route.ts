import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";

const AttributeDefSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  labelAr: z.string().optional(),
  type: z.enum(["text", "select", "multiselect", "range", "boolean"]),
  options: z.array(z.string()).optional(),
  unit: z.string().optional(),
});

const CategorySchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional().default(""),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  attributeSchema: z.array(AttributeDefSchema).default([]),
});

// GET /api/admin/categories
export const GET = withErrorHandler(async (_req: NextRequest) => {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      children: { orderBy: { sortOrder: "asc" } },
      _count: { select: { products: true } },
    },
  });
  return apiSuccess(categories);
});

// POST /api/admin/categories
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();
  const data = CategorySchema.parse(body);

  if (data.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent) return apiError(ErrorCodes.NOT_FOUND);
    // Prevent circular: a parent cannot have a parent itself with parentId = new cat's id (simple check)
    if (parent.parentId) {
      return apiError(ErrorCodes.VALIDATION_ERROR, "Categories can only be nested one level deep", 400);
    }
  }

  const category = await prisma.category.create({ data: { ...data, parentId: data.parentId ?? null } });
  return apiSuccess(category, undefined, 201);
});
