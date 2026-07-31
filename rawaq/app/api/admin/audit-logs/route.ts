import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler, parsePagination, paginationMeta } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";

// GET /api/admin/audit-logs
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const { page, pageSize, skip } = parsePagination(searchParams);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        admin: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count()
  ]);

  return apiSuccess(logs, paginationMeta(total, page, pageSize));
});
