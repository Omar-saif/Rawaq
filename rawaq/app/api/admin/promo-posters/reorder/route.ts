import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";

const ReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int(),
  })),
});

// PATCH /api/admin/promo-posters/reorder
export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const body = await req.json();
  const data = ReorderSchema.parse(body);

  // Prisma doesn't have a bulk update with different values per ID natively.
  // So we run a transaction of individual updates.
  await prisma.$transaction(
    data.items.map((item) =>
      prisma.promoPoster.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return apiSuccess(null);
});
