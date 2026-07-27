"use client";

import React, { useState, useEffect } from "react";
import { ProductCard, ProductCardData } from "@/components/ui/ProductCard";

interface RelatedProductsProps {
  initialProducts: ProductCardData[];
  categoryId: string;
  currentSlug: string;
  locale: string;
}

export function RelatedProducts({ initialProducts, categoryId, currentSlug, locale }: RelatedProductsProps) {
  const [products, setProducts] = useState<ProductCardData[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  
  // A mock filter state for demonstration (e.g. "Size", "Scent")
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!filter) {
      setProducts(initialProducts);
      return;
    }
    
    async function fetchFiltered() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?categoryId=${categoryId}&pageSize=4&attribute=${filter}`);
        const json = await res.json();
        const items: ProductCardData[] = json.data ?? [];
        setProducts(items.filter((p) => p.slug !== currentSlug).slice(0, 4));
      } catch {
        // Fallback or error handling
      } finally {
        setLoading(false);
      }
    }
    fetchFiltered();
  }, [filter, categoryId, currentSlug, initialProducts]);

  return (
    <section className="mt-20 pt-10 border-t border-[var(--color-border)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">
          {locale === "ar" ? "قد يعجبك أيضاً" : "You May Also Like"}
        </h2>
        
        {/* Compact filter/refine control */}
        <div className="flex gap-2">
          {["S", "M", "L", "Oud", "Musk"].map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(filter === opt ? "" : opt)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filter === opt 
                  ? "bg-[var(--color-brand-navy)] text-white border-[var(--color-brand-navy)]" 
                  : "bg-white text-[var(--color-gray-600)] border-[var(--color-border)] hover:border-[var(--color-brand-navy)]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-[var(--color-muted)] animate-pulse">
          {locale === "ar" ? "جاري التحميل..." : "Loading..."}
        </div>
      ) : products.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-[var(--color-muted)]">
          {locale === "ar" ? "لا توجد منتجات مطابقة" : "No matching products found"}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
