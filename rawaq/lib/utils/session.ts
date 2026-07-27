import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { ApiException, ErrorCodes } from "./api";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

export interface SessionPayload {
  userId: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  iat?: number;
  exp?: number;
}

const COOKIE_NAME = "rawaq_session";
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

// ── Sign a JWT ─────────────────────────────────────────────────────────────
export async function signSession(payload: Omit<SessionPayload, "iat" | "exp">) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);
}

// ── Verify a JWT ───────────────────────────────────────────────────────────
export async function verifySession(token: string): Promise<SessionPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    throw new ApiException(ErrorCodes.INVALID_TOKEN, "Invalid or expired session", 401);
  }
}

// ── Set session cookie ─────────────────────────────────────────────────────
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

// ── Clear session cookie ───────────────────────────────────────────────────
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ── Get current session (from cookie) ─────────────────────────────────────
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

// ── Guards ─────────────────────────────────────────────────────────────────
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new ApiException(
      ErrorCodes.UNAUTHORIZED,
      "Authentication required",
      401
    );
  }
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    throw new ApiException(
      ErrorCodes.FORBIDDEN,
      "Admin access required",
      403
    );
  }
  return session;
}
