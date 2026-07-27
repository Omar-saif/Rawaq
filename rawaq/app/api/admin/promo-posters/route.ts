import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";

const PromoPosterSchema = z.object({
  imageUrl: z.string().url(),
  linkUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

// GET /api/admin/promo-posters
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const posters = await prisma.promoPoster.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return apiSuccess(posters);
});

// POST /api/admin/promo-posters
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const body = await req.json();
  const data = PromoPosterSchema.parse(body);

  const newPoster = await prisma.promoPoster.create({
    data: {
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  });

  return apiSuccess(newPoster);
});
