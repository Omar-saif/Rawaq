import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";
import crypto from "crypto";
import { sendEmail, getPasswordResetEmail } from "@/lib/email";
import { env } from "@/lib/env";

export const GET = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, phone: true, createdAt: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, total: true, status: true, channel: true, createdAt: true,
          items: { select: { quantity: true } }
        }
      },
      addresses: true
    }
  });

  if (!user) return apiError(ErrorCodes.NOT_FOUND, "Customer not found", 404);
  return apiSuccess(user);
});

// POST /api/admin/customers/[id]/reset-password - trigger a reset email manually
export const POST = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return apiError(ErrorCodes.NOT_FOUND, "Customer not found", 404);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id },
    data: { resetTokenHash: tokenHash, resetTokenExpiry: expiry },
  });

  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/en/reset-password?token=${rawToken}`;
  const { subject, html } = getPasswordResetEmail(resetUrl, "en");
  await sendEmail({ to: user.email, subject, html });

  return apiSuccess({ message: "Password reset email sent to customer" });
});
