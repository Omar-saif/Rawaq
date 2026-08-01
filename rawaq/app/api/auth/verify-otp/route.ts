import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  apiSuccess,
  apiError,
  ErrorCodes,
  withErrorHandler,
} from "@/lib/utils/api";
import { verifyOtpHash } from "@/lib/auth/otp";
import { signSession, setSessionCookie } from "@/lib/utils/session";
import { checkRateLimit } from "@/lib/utils/rateLimit";

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  // Rate limit verification attempts slightly higher than registration
  if (!checkRateLimit(`verify_${ip}`, 10, 15 * 60 * 1000)) {
    return apiError(ErrorCodes.RATE_LIMIT, "Too many verification attempts. Please wait 15 minutes.", 429);
  }

  const body = await req.json();
  const data = VerifyOtpSchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user) {
    // Return generic error to prevent email enumeration
    return apiError(ErrorCodes.NOT_FOUND, "Invalid request", 400);
  }

  // Find the most recent OTP for this user
  const otpRecord = await prisma.emailOtp.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return apiError(ErrorCodes.NOT_FOUND, "No verification code found. Please request a new one.", 400);
  }

  // Check if expired
  if (otpRecord.expiresAt < new Date()) {
    return apiError("OTP_EXPIRED" as any, "Verification code has expired. Please request a new one.", 400);
  }

  // Check max attempts
  if (otpRecord.attempts >= 5) {
    // Delete the record since it's fully invalidated
    await prisma.emailOtp.delete({ where: { id: otpRecord.id } });
    return apiError("OTP_MAX_ATTEMPTS" as any, "Too many incorrect attempts. Please request a new code.", 400);
  }

  // Verify code
  const isValid = await verifyOtpHash(data.code, otpRecord.codeHash);

  if (!isValid) {
    // Increment attempts
    const updated = await prisma.emailOtp.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    if (updated.attempts >= 5) {
      await prisma.emailOtp.delete({ where: { id: otpRecord.id } });
      return apiError("OTP_MAX_ATTEMPTS" as any, "Too many incorrect attempts. Please request a new code.", 400);
    }

    return apiError(ErrorCodes.VALIDATION_ERROR, "Invalid verification code", 400);
  }

  // Success!
  // 1. Mark email as verified
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  // 2. Delete the used OTP
  await prisma.emailOtp.delete({ where: { id: otpRecord.id } });

  // 3. Issue session
  const token = await signSession({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  await setSessionCookie(token);

  return apiSuccess({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});
