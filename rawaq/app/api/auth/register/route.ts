import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
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

const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().optional(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  // Max 5 registrations per 15 minutes per IP
  if (!checkRateLimit(`register_${ip}`, 5, 15 * 60 * 1000)) {
    return apiError(ErrorCodes.RATE_LIMIT, "Too many registration attempts. Please wait 15 minutes.", 429);
  }

  const body = await req.json();
  const data = RegisterSchema.parse(body);

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    return apiError(ErrorCodes.USER_EXISTS, "An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      phone: data.phone,
      passwordHash,
      role: "CUSTOMER",
      emailVerified: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate OTP
  const rawOtp = generateOtp();
  const hashedOtp = await hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  await prisma.emailOtp.create({
    data: {
      userId: user.id,
      codeHash: hashedOtp,
      expiresAt,
    },
  });

  // Send OTP Email (fire and forget)
  const locale = req.headers.get("x-invoke-path")?.startsWith("/ar") ? "ar" : "en";
  const { subject, html } = getOtpEmail(rawOtp, locale);
  sendEmail({ to: user.email, subject, html }).catch(console.error);

  return apiSuccess({ requiresVerification: true, email: user.email }, undefined, 201);
});
