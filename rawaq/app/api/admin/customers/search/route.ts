import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";
import { Prisma } from "@prisma/client";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (query.length < 2) {
    return apiSuccess([]);
  }

  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
    ],
  };

  const users = await prisma.user.findMany({
    where,
    take: 10,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  return apiSuccess(users);
});
