'use client';

import Link from 'next/link';
import { ShoppingCart, User, Store } from 'lucide-react';
import { useCart } from '@/lib/store';

export default function Navbar() {
  const cartItems = useCart((state) => state.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600">
            <Store className="w-8 h-8" />
            <span>NavyShop</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/shop" className="text-gray-600 hover:text-blue-600 font-medium">
              Shop
            </Link>
            <Link href="/account" className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1">
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">Account</span>
            </Link>
            <Link href="/cart" className="relative text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1">
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-3 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
