import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

// ── Standard API Error Response Shape ────────────────────────────────────────
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccess<T = unknown> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

// ── Error Codes ───────────────────────────────────────────────────────────────
export const ErrorCodes = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_EXISTS: "USER_EXISTS",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Business logic
  OUT_OF_STOCK: "OUT_OF_STOCK",
  COUPON_INVALID: "COUPON_INVALID",
  COUPON_EXPIRED: "COUPON_EXPIRED",
  COUPON_USAGE_LIMIT: "COUPON_USAGE_LIMIT",
  COUPON_MIN_CART: "COUPON_MIN_CART",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",

  // Generic
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMIT: "RATE_LIMIT",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ── Response Helpers ──────────────────────────────────────────────────────────
export function apiSuccess<T>(data: T, meta?: ApiSuccess["meta"], status = 200) {
  const body: ApiSuccess<T> = { data };
  if (meta) body.meta = meta;
  return NextResponse.json(body, { status });
}

export function apiError(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  const body: ApiError = { error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return NextResponse.json(body, { status });
}

// ── Error Handler Wrapper ─────────────────────────────────────────────────────
type RouteHandler = (req: NextRequest, ctx?: unknown) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx?: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      // Zod validation errors
      if (err instanceof ZodError) {
        return apiError(
          ErrorCodes.VALIDATION_ERROR,
          "Invalid request data",
          400,
          err.flatten().fieldErrors
        );
      }

      // Known API errors (thrown by our code)
      if (err instanceof ApiException) {
        return apiError(err.code, err.message, err.status);
      }

      // Log unexpected errors (never leak stack traces to client)
      console.error("[API Error]", err);
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        "An unexpected error occurred",
        500
      );
    }
  };
}

// ── Custom Error Class ────────────────────────────────────────────────────────
export class ApiException extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiException";
  }
}

// ── Pagination Helper ─────────────────────────────────────────────────────────
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
  );
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

export function paginationMeta(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
