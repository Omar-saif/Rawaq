'use client';

import { useState } from 'react';
import { useCart } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
  const { items, getTotalAmount, clearCart } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (items.length === 0) {
    return (
      <main className="min-h-screen p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <a href="/shop" className="text-blue-600 underline">Return to shop</a>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const orderData = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      zipCode: formData.get('zipCode'),
      totalAmount: getTotalAmount(),
      items: items,
      userId: null, // This would be populated by NextAuth if logged in
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        clearCart();
        setIsSuccess(true);
      } else {
        alert('Something went wrong with your order.');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen p-4 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <div className="bg-green-100 p-6 rounded-full mb-6">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Order Placed!</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Thank you for your purchase. We have received your order and are processing it.
        </p>
        <div className="flex gap-4">
          <a href="/shop" className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
            Continue Shopping
          </a>
          <a href="/account" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
            View My Orders
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="flex-1 bg-white border rounded-3xl p-8 space-y-6">
          <h3 className="text-xl font-bold mb-4">Shipping Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">Full Name</label>
              <input name="fullName" required className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">Email Address</label>
              <input name="email" type="email" required className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">Phone Number</label>
              <input name="phone" required className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">City</label>
              <input name="city" required className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Street Address</label>
              <input name="address" required className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">State/Region</label>
              <input name="state" required className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">Zip Code</label>
              <input name="zipCode" required className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="pt-6 border-t">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment
            </h3>
            <p className="text-gray-500 mb-6">For this demo, payment is processed as 'Cash on Delivery'.</p>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isLoading ? 'Processing...' : `Place Order $${getTotalAmount().toFixed(2)}`}
            </button>
          </div>
        </form>

        {/* Summary */}
        <aside className="w-full lg:w-96">
          <div className="bg-white border rounded-3xl p-6 sticky top-24">
            <h3 className="text-xl font-bold mb-6">Order Summary</h3>
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-gray-600">
                  <span className="truncate max-w-[150px]">{item.name} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-4 border-t flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>${getTotalAmount().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
