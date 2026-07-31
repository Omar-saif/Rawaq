import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler, parsePagination, paginationMeta } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";

// GET /api/products/[slug]/reviews
export const GET = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const { params } = ctx as { params: Promise<{ slug: string }> };
  const { slug } = await params;
  
  const { searchParams } = new URL(req.url);
  const { page, pageSize, skip } = parsePagination(searchParams);

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return apiError(ErrorCodes.NOT_FOUND, "Product not found", 404);

  const [reviews, total, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize
    }),
    prisma.review.count({ where: { productId: product.id } }),
    prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true }
    })
  ]);

  const meta = {
    ...paginationMeta(total, page, pageSize),
    averageRating: aggregate._avg.rating || 0
  };

  return apiSuccess(reviews, meta);
});

// POST /api/products/[slug]/reviews
export const POST = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const session = await getSession();
  if (!session) return apiError(ErrorCodes.UNAUTHORIZED, "Unauthorized", 401);

  const { params } = ctx as { params: Promise<{ slug: string }> };
  const { slug } = await params;

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return apiError(ErrorCodes.NOT_FOUND, "Product not found", 404);

  // Optional: check if user bought it
  const hasBought = await prisma.order.findFirst({
    where: {
      userId: session.userId,
      items: { some: { productId: product.id } }
    }
  });

  if (!hasBought) {
    return apiError(ErrorCodes.FORBIDDEN, "You must purchase the product to review it", 403);
  }

  // Optional: check if already reviewed
  const existing = await prisma.review.findFirst({
    where: { productId: product.id, userId: session.userId }
  });

  if (existing) {
    return apiError(ErrorCodes.INVALID_INPUT, "You have already reviewed this product", 400);
  }

  const body = await req.json();
  const { rating, comment } = body;
  
  if (!rating || rating < 1 || rating > 5) {
    return apiError(ErrorCodes.INVALID_INPUT, "Invalid rating", 400);
  }

  const review = await prisma.review.create({
    data: {
      rating,
      comment,
      productId: product.id,
      userId: session.userId,
    }
  });

  return apiSuccess(review);
});
