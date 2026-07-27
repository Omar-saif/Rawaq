import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler, parsePagination, paginationMeta } from "@/lib/utils/api";
import { requireAuth } from "@/lib/utils/session";

// GET /api/account/orders
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const { searchParams } = new URL(req.url);
  const { page, pageSize, skip } = parsePagination(searchParams);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        items: {
          include: {
            product: { select: { title: true, images: true, slug: true } },
            variant: { select: { variantType: true, value: true } },
          },
        },
        coupon: { select: { code: true, discountType: true, discountValue: true } },
      },
    }),
    prisma.order.count({ where: { userId: session.userId } }),
  ]);

  return apiSuccess(orders, paginationMeta(total, page, pageSize));
});
