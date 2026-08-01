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
import { signSession, setSessionCookie } from "@/lib/utils/session";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Simple in-memory rate limiter (per IP) for login attempts
// In production, use Redis or an edge rate-limiting solution
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || record.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_ATTEMPTS) return false;
  record.count++;
  return true;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";

  if (!checkRateLimit(ip)) {
    return apiError(ErrorCodes.RATE_LIMIT, "Too many login attempts. Please wait 15 minutes.", 429);
  }

  const body = await req.json();
  const data = LoginSchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  // Use constant-time comparison to prevent timing attacks
  const dummyHash = "$2b$12$notavalidhashbutsamelength00000000000000000000";
  const passwordMatch = user
    ? await bcrypt.compare(data.password, user.passwordHash)
    : await bcrypt.compare(data.password, dummyHash);

  if (!user || !passwordMatch) {
    return apiError(ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password", 401);
  }

  if (!user.emailVerified) {
    return apiError("UNVERIFIED_EMAIL" as any, "Please verify your email address before logging in", 403);
  }

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
