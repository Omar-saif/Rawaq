import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler, parsePagination, paginationMeta } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";
import { Prisma, OrderStatus } from "@prisma/client";

// GET /api/admin/orders
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const { page, pageSize, skip } = parsePagination(searchParams);
  const status = searchParams.get("status") as OrderStatus | null;

  const where: Prisma.OrderWhereInput = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip, take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
        coupon: { select: { code: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return apiSuccess(orders, paginationMeta(total, page, pageSize));
});
