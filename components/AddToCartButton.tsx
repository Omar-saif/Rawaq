'use client';

import { useCart } from '@/lib/store';
import { ShoppingCart } from 'lucide-react';

export default function AddToCartButton({ product }: { product: any }) {
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      image: product.image,
    });
  };

  return (
    <button
      onClick={handleAdd}
      disabled={!product.inStock}
      className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      <ShoppingCart className="w-5 h-5" />
      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
    </button>
  );
}
