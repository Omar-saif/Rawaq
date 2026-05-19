import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) notFound();

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <Link href="/account" className="text-blue-600 hover:underline mb-8 inline-block">
        $\leftarrow$ Back to Orders
      </Link>

      <div className="bg-white border rounded-3xl p-8 shadow-sm">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-bold ${
            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {order.status}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-2">
            <h3 className="font-bold text-gray-700">Shipping Address</h3>
            <p className="text-gray-600">{order.fullName}</p>
            <p className="text-gray-600">{order.address}, {order.city}</p>
            <p className="text-gray-600">{order.state}, {order.zipCode}</p>
            <p className="text-gray-600">{order.phone}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-gray-700">Payment</h3>
            <p className="text-gray-600">Method: Cash on Delivery</p>
            <p className="text-xl font-bold text-blue-600 mt-2">Total: ${Number(order.totalAmount).toFixed(2)}</p>
          </div>
        </div>

        <div className="border-t pt-8">
          <h3 className="font-bold text-lg mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {item.product.image ? (
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No Image</div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-bold">${(Number(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
