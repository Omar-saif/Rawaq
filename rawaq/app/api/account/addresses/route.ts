import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAuth } from "@/lib/utils/session";

const AddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().default("SA"),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

// GET /api/account/addresses
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await requireAuth();
  const addresses = await prisma.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  return apiSuccess(addresses);
});

// POST /api/account/addresses
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const body = await req.json();
  const data = AddressSchema.parse(body);

  // If setting as default, clear other defaults first
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.userId },
      data: { isDefault: false },
    });
  }

  // If first address, make it default automatically
  const count = await prisma.address.count({ where: { userId: session.userId } });

  const address = await prisma.address.create({
    data: { ...data, userId: session.userId, isDefault: data.isDefault || count === 0 },
  });

  return apiSuccess(address, undefined, 201);
});
