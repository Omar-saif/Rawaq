import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { getSession } from "@/lib/utils/session";

// GET /api/products/[slug]
export const GET = withErrorHandler(
  async (_req: NextRequest, ctx: unknown) => {
    const { params } = ctx as { params: Promise<{ slug: string }> };
    const { slug } = await params;
    const session = await getSession();
    const isAdmin = session?.role === "ADMIN";

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          include: { parent: { select: { id: true, name: true, slug: true } } },
        },
        variants: {
          orderBy: [{ variantType: "asc" }, { value: "asc" }],
        },
      },
    });

    if (!product || (!isAdmin && !product.isActive)) {
      return apiError(ErrorCodes.NOT_FOUND, "Product not found", 404);
    }

    return apiSuccess(product);
  }
);
