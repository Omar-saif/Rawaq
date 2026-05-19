import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function AccountPage() {
  // In a real app, we'd get the userId from the session
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white border rounded-3xl p-12 text-center">
          <p className="text-gray-500 text-lg">You haven't placed any orders yet.</p>
          <Link href="/shop" className="text-blue-600 hover:underline mt-4 inline-block">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/order/${order.id}`}
              className="bg-white border rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-blue-600 transition"
            >
              <div>
                <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
                <h3 className="font-bold text-lg">{new Date(order.createdAt).toLocaleDateString()}</h3>
                <p className="text-gray-600">${Number(order.totalAmount).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                  order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {order.status}
                </span>
                <span className="text-blue-600 font-medium hover:underline">View Details $\rightarrow$</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
