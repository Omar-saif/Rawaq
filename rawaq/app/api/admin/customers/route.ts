import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";

// GET /api/admin/customers
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim() || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const skip = (page - 1) * pageSize;

  const where = {
    role: "CUSTOMER" as const,
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ]
    } : {})
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        _count: {
          select: { orders: true }
        }
      }
    }),
    prisma.user.count({ where }),
  ]);

  const userIds = users.map(u => u.id);
  const orderTotals = await prisma.order.groupBy({
    by: ['userId'],
    where: { 
      userId: { in: userIds },
      status: { not: "CANCELLED" }
    },
    _sum: {
      total: true
    }
  });

  const totalsMap = new Map(orderTotals.map(t => [t.userId, t._sum.total ? parseFloat(t._sum.total.toString()) : 0]));

  return apiSuccess({
    users: users.map(u => ({ 
      ...u, 
      orderCount: u._count.orders,
      totalSpent: totalsMap.get(u.id) || 0
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});
