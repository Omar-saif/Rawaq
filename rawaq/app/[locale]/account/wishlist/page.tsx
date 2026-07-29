"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import Image from "next/image";
import { PriceTag } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Modal";

export default function WishlistPage() {
  const locale = useLocale();
  const { addToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/wishlist");
      if (res.ok) {
        const json = await res.json();
        setItems(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const handleRemove = async (productId: string) => {
    setRemoving(productId);
    try {
      const res = await fetch(`/api/account/wishlist?productId=${productId}`, { method: "DELETE" });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.product.id !== productId));
        addToast("success", locale === "ar" ? "تمت الإزالة من قائمة الأمنيات" : "Removed from wishlist");
      }
    } catch {
      addToast("error", locale === "ar" ? "فشلت الإزالة" : "Failed to remove");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="flex-1 bg-[var(--color-gray-50)] py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-6">
          <Link href="/account" className="hover:text-[var(--color-brand-navy)]">{locale === "ar" ? "حسابي" : "My Account"}</Link>
          <span>›</span>
          <span className="font-medium text-[var(--color-brand-navy)]">{locale === "ar" ? "قائمة الأمنيات" : "Wishlist"}</span>
        </div>

        <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
            <h1 className="text-xl font-bold text-[var(--color-brand-navy)]">
              {locale === "ar" ? "قائمة الأمنيات" : "My Wishlist"}
            </h1>
            <span className="text-sm font-medium text-[var(--color-muted)]">{items.length} {locale === "ar" ? "عناصر" : "items"}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[var(--color-muted)] animate-pulse">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-4xl mb-4">❤️</p>
              <h2 className="text-lg font-bold text-[var(--color-brand-navy)] mb-2">
                {locale === "ar" ? "قائمتك فارغة" : "Your wishlist is empty"}
              </h2>
              <p className="text-[var(--color-muted)] mb-6">
                {locale === "ar" ? "احفظ منتجاتك المفضلة هنا" : "Save your favorite products here to easily find them later."}
              </p>
              <Link href="/">
                <Button variant="primary">
                  {locale === "ar" ? "تصفح المنتجات" : "Browse Products"}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {items.map((item) => (
                <div key={item.id} className="group flex flex-col bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden hover:shadow-md transition-shadow relative">
                  <button 
                    onClick={() => handleRemove(item.product.id)}
                    disabled={removing === item.product.id}
                    className="absolute top-3 end-3 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    ×
                  </button>
                  
                  <Link href={`/product/${item.product.slug}`} className="block relative aspect-[4/5] bg-[var(--color-gray-100)] overflow-hidden">
                    {item.product.images[0] ? (
                      <Image 
                        src={item.product.images[0]} 
                        alt={item.product.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--color-gray-300)]">📦</div>
                    )}
                  </Link>

                  <div className="p-4 flex flex-col flex-1">
                    <Link href={`/product/${item.product.slug}`} className="block font-bold text-[var(--color-foreground)] hover:text-[var(--color-brand-navy)] transition-colors line-clamp-2 min-h-[2.5rem] mb-2">
                      {locale === "ar" && item.product.titleAr ? item.product.titleAr : item.product.title}
                    </Link>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <PriceTag 
                        price={item.product.salePrice ?? item.product.price} 
                        salePrice={item.product.salePrice ? item.product.price : undefined} 
                        locale={locale} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
