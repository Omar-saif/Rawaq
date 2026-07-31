import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";
import { logAdminAction } from "@/lib/utils/audit";

// POST /api/admin/audit-logs/prune
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdmin();

  // 90 days ago
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  await logAdminAction({
    adminId: session.userId,
    action: "PRUNE_AUDIT_LOGS",
    resource: "AuditLog",
    details: { deletedCount: result.count, cutoffDate },
  });

  return apiSuccess({ deletedCount: result.count });
});
