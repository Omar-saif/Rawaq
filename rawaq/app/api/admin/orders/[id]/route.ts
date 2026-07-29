import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, ErrorCodes, withErrorHandler } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/session";
import { OrderStatus } from "@prisma/client";
import { logAdminAction } from "@/lib/utils/audit";
import { sendEmail, getOrderStatusEmail } from "@/lib/email";

// Valid status transitions — prevents illegal state changes
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:          ["PAID", "CANCELLED"],
  PAID:             ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED:           ["SHIPPED"],
  SHIPPED:          ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED:        [],
  CANCELLED:        [],
};

const UpdateOrderSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]).optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
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
  const { status: newStatus, trackingNumber, trackingUrl } = UpdateOrderSchema.parse(body);

  const order = await prisma.order.findUnique({ where: { id }, include: { user: true } });
  if (!order) return apiError(ErrorCodes.NOT_FOUND, "Order not found", 404);

  if (newStatus && newStatus !== order.status) {
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      return apiError(
        ErrorCodes.INVALID_STATUS_TRANSITION,
        `Cannot transition from ${order.status} to ${newStatus}`,
        400
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const dataToUpdate: any = {};
    if (newStatus) dataToUpdate.status = newStatus;
    if (trackingNumber !== undefined) dataToUpdate.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) dataToUpdate.trackingUrl = trackingUrl;

    const updatedOrder = await tx.order.update({ where: { id }, data: dataToUpdate });

    // Restore stock if cancelled
    if (newStatus === "CANCELLED" && order.status !== "CANCELLED") {
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

  // Send status update email if applicable
  if (newStatus && newStatus !== order.status && (newStatus === "SHIPPED" || newStatus === "DELIVERED" || newStatus === "OUT_FOR_DELIVERY")) {
    const emailTo = order.user?.email || order.guestEmail;
    if (emailTo) {
      const { subject, html } = getOrderStatusEmail(updated, newStatus, "en");
      sendEmail({ to: emailTo, subject, html }).catch(console.error);
    }
  }

  return apiSuccess(updated);
});
