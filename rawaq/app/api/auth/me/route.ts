import { NextRequest } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/utils/session";
import { apiSuccess, withErrorHandler } from "@/lib/utils/api";
import { prisma } from "@/lib/db/prisma";

// GET /api/auth/me — returns current session user or null
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await getSession();
  if (!session) return apiSuccess({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
  });

  return apiSuccess({ user });
});

// POST /api/auth/me — logout (clears session cookie)
export const POST = withErrorHandler(async (_req: NextRequest) => {
  await clearSessionCookie();
  return apiSuccess({ message: "Logged out successfully" });
});
