import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";

const DeliveryVendorSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().default(""),
  logoUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  estimatedDays: z.string().min(1),
  estimatedDaysAr: z.string().default(""),
  price: z.number().min(0),
  isActive: z.boolean().default(true),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const vendors = await prisma.deliveryVendor.findMany({
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(vendors);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return apiError(ErrorCodes.UNAUTHORIZED);

  const body = await req.json();
  const data = DeliveryVendorSchema.parse(body);

  const newVendor = await prisma.deliveryVendor.create({
    data: {
      ...data,
      logoUrl: data.logoUrl || null,
      description: data.description || null,
      descriptionAr: data.descriptionAr || null,
    },
  });

  return apiSuccess(newVendor);
});
