import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler } from "@/lib/utils/api";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const vendors = await prisma.deliveryVendor.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  return apiSuccess(vendors);
});
