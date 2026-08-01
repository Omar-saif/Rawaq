import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { sendEmail, getPasswordResetEmail } from "@/lib/email";
import { env } from "@/lib/env";

const ForgotSchema = z.object({
  email: z.string().email(),
});

const ResetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

// POST /api/auth/forgot-password
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { email } = ForgotSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always return success to avoid user enumeration
  if (!user) return apiSuccess({ message: "If this email exists, a reset link has been sent." });

  // Generate a secure token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash: tokenHash, resetTokenExpiry: expiry },
  });

  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/en/reset-password?token=${rawToken}`; // We can localize later based on request

  // Send the real email
  const { subject, html } = getPasswordResetEmail(resetUrl, "en"); // Fallback to EN, can parse header for locale
  await sendEmail({ to: email, subject, html });

  console.log(`[Password Reset] Email sent to: ${email}`);

  return apiSuccess({ message: "If this email exists, a reset link has been sent." });
});

// PUT /api/auth/forgot-password — reset password with token
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { token, password } = ResetSchema.parse(body);

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpiry: { gt: new Date() }, // not expired
    },
  });

  if (!user) {
    return apiError(ErrorCodes.INVALID_TOKEN, "Reset token is invalid or has expired", 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Update password and clear the reset token (single-use)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiry: null,
    },
  });

  return apiSuccess({ message: "Password updated successfully" });
});
