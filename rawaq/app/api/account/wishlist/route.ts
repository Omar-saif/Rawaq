import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";

// GET /api/account/wishlist
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session) return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId: session.userId },
    include: {
      product: {
        select: { id: true, title: true, titleAr: true, slug: true, price: true, salePrice: true, images: true, inventoryCount: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return apiSuccess(wishlist);
});

// POST /api/account/wishlist
// Body: { productId: string }
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session) return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const body = await req.json();
  const { productId } = body;
  if (!productId) return apiError(ErrorCodes.INVALID_INPUT, "productId is required", 400);

  // Check if exists
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.userId, productId } }
  });

  if (existing) {
    return apiSuccess({ message: "Already in wishlist" });
  }

  const item = await prisma.wishlistItem.create({
    data: { userId: session.userId, productId }
  });

  return apiSuccess(item);
});

// DELETE /api/account/wishlist?productId=123
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  if (!session) return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return apiError(ErrorCodes.INVALID_INPUT, "productId is required", 400);

  await prisma.wishlistItem.deleteMany({
    where: { userId: session.userId, productId }
  });

  return apiSuccess({ message: "Removed from wishlist" });
});
