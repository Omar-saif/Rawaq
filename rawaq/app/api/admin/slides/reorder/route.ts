import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";

const ReorderSchema = z.object({
  items: z.array(
    z.object({
      id:        z.string(),
      sortOrder: z.number().int(),
    })
  ).min(1),
});

// PATCH /api/admin/slides/reorder — accepts [{id, sortOrder}] array
export const PATCH = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();
  const { items } = ReorderSchema.parse(body);

  // Batch update in a transaction
  await prisma.$transaction(
    items.map((item) =>
      prisma.slide.update({
        where: { id: item.id },
        data:  { sortOrder: item.sortOrder },
      })
    )
  );

  return apiSuccess({ updated: items.length });
});
