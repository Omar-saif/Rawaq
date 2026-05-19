import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName, email, phone, address, city, state, zipCode,
      totalAmount, items, userId
    } = body;

    // Create the order and items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          fullName,
          email,
          phone,
          address,
          city,
          state,
          zipCode,
          totalAmount,
          userId: userId || null,
          status: 'PENDING',
        },
      });

      const orderItemsData = items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        orderId: order.id,
      }));

      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      return order;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
