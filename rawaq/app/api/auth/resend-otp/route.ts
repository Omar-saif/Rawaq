import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  apiSuccess,
  apiError,
  ErrorCodes,
  withErrorHandler,
} from "@/lib/utils/api";
import { sendEmail, getOtpEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/utils/rateLimit";
import { generateOtp, hashOtp } from "@/lib/auth/otp";

const ResendOtpSchema = z.object({
  email: z.string().email(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const data = ResendOtpSchema.parse(body);
  const emailLower = data.email.toLowerCase();

  // Rate limit: max 3 resend requests per email per 15 minutes
  if (!checkRateLimit(`resend_otp_${emailLower}`, 3, 15 * 60 * 1000)) {
    return apiError(ErrorCodes.RATE_LIMIT, "Too many resend attempts. Please wait 15 minutes.", 429);
  }

  const user = await prisma.user.findUnique({
    where: { email: emailLower },
  });

  // If user doesn't exist or is already verified, just return success to avoid enumeration,
  // or return an error if it's already verified so the frontend can redirect.
  // Returning an error for already verified is helpful UX.
  if (!user) {
    return apiSuccess({ message: "If this email is registered, a code has been sent." });
  }

  if (user.emailVerified) {
    return apiError(ErrorCodes.VALIDATION_ERROR, "Account is already verified.", 400);
  }

  // Delete any existing OTP records for this user to invalidate them
  await prisma.emailOtp.deleteMany({
    where: { userId: user.id },
  });

  // Generate new OTP
  const rawOtp = generateOtp();
  const hashedOtp = await hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.emailOtp.create({
    data: {
      userId: user.id,
      codeHash: hashedOtp,
      expiresAt,
    },
  });

  // Send new OTP Email (fire and forget)
  const locale = req.headers.get("x-invoke-path")?.startsWith("/ar") ? "ar" : "en";
  const { subject, html } = getOtpEmail(rawOtp, locale);
  sendEmail({ to: user.email, subject, html }).catch(console.error);

  return apiSuccess({ message: "Verification code sent." });
});
