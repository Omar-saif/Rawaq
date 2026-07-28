import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";

// GET /api/cart
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await getSession();
  
  // If no session, they are a guest. A full implementation would use cookies to track a guest cart.
  // For now, if no session, we just return empty or look for a cookie (omitted for brevity).
  if (!session) {
    return apiSuccess({ items: [] });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, title: true, titleAr: true, slug: true, price: true, salePrice: true, images: true, inventoryCount: true } },
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    return apiSuccess({ items: [] });
  }

  return apiSuccess(cart);
});
