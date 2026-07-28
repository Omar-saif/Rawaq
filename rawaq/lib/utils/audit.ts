import { prisma } from "@/lib/db/prisma";

/**
 * Helper to create an audit log for admin actions.
 */
export async function logAdminAction({
  adminId,
  action,
  resource,
  resourceId,
  details,
}: {
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        resource,
        resourceId,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined, // Ensure it's JSON serializable
      },
    });
  } catch (error) {
    // We don't want audit logging failures to crash the main request
    console.error("Failed to write audit log:", error);
  }
}
