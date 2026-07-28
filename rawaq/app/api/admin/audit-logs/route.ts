import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";

// GET /api/admin/audit-logs
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      admin: { select: { name: true, email: true } },
    },
  });

  return apiSuccess(logs);
});
