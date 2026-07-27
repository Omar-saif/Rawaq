import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";

const SidePromoSchema = z.object({
  imageUrl: z.string().url(),
  linkUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  targetPages: z.array(z.string()).min(1),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

// GET /api/admin/side-promos
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const promos = await prisma.sidePromo.findMany({
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(promos);
});

// POST /api/admin/side-promos
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED);

  const body = await req.json();
  const data = SidePromoSchema.parse(body);

  const newPromo = await prisma.sidePromo.create({
    data: {
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  });

  return apiSuccess(newPromo);
});
