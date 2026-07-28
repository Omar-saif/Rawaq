import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";
import { OrderStatus } from "@prisma/client";
import { logAdminAction } from "@/lib/utils/audit";

// Valid status transitions — prevents illegal state changes
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   ["PAID", "CANCELLED"],
  PAID:      ["SHIPPED", "CANCELLED"],
  SHIPPED:   ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const UpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/orders/[id]
export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  const { params } = ctx as Ctx;
  const { id } = await params;
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          product: { select: { title: true, images: true, slug: true } },
          variant: { select: { variantType: true, value: true } },
        },
      },
      coupon: true,
    },
  });

  if (!order) return apiError(ErrorCodes.NOT_FOUND, "Order not found", 404);
  return apiSuccess(order);
});

// PATCH /api/admin/orders/[id]/status — handled at [id]/status/route.ts
// But we also support it here via PATCH for convenience
export const PATCH = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const { params } = ctx as Ctx;
  const { id } = await params;
  const session = await requireAdmin();

  const body = await req.json();
  const { status: newStatus } = UpdateStatusSchema.parse(body);

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return apiError(ErrorCodes.NOT_FOUND, "Order not found", 404);

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    return apiError(
      ErrorCodes.INVALID_STATUS_TRANSITION,
      `Cannot transition from ${order.status} to ${newStatus}`,
      400
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({ where: { id }, data: { status: newStatus } });

    // Restore stock if cancelled
    if (newStatus === "CANCELLED") {
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockCount: { increment: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { inventoryCount: { increment: item.quantity } },
          });
        }
      }
    }
    
    return updatedOrder;
  });

  await logAdminAction({
    adminId: session.userId,
    action: "UPDATE_ORDER_STATUS",
    resource: "Order",
    resourceId: id,
    details: { oldStatus: order.status, newStatus },
  });

  return apiSuccess(updated);
});
