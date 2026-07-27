"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface FilterSidebarProps {
  categories?: any[];
  showCategoryFilter?: boolean;
}

export function FilterSidebar({ categories = [], showCategoryFilter = false }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();

  // Local state for ranges, though we apply them immediately on change for simplicity
  // or on a "Apply" button. We'll do on change.
  
  const currentCategory = searchParams.get("categorySlug") || "";
  const currentMin = searchParams.get("minPrice") || "";
  const currentMax = searchParams.get("maxPrice") || "";
  
  const handleUpdate = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // Reset page to 1 on filter change
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-[var(--radius-xl)] p-6 border border-[var(--color-border)] shadow-sm space-y-8">
      <div>
        <h3 className="font-bold text-[var(--color-brand-navy)] mb-4 uppercase tracking-wider text-sm">
          Filters
        </h3>
        <div className="w-8 h-1 bg-[var(--color-brand-gold)] mb-4" />
      </div>

      {showCategoryFilter && categories.length > 0 && (
        <div>
          <h4 className="font-semibold text-[var(--color-gray-800)] mb-3 text-sm">Category</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="category" 
                checked={currentCategory === ""} 
                onChange={() => handleUpdate("categorySlug", "")}
                className="accent-[var(--color-brand-navy)]"
              />
              <span className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-brand-navy)]">All Categories</span>
            </label>
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="category" 
                  checked={currentCategory === cat.slug}
                  onChange={() => handleUpdate("categorySlug", cat.slug)}
                  className="accent-[var(--color-brand-navy)]"
                />
                <span className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-brand-navy)]">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-[var(--color-gray-800)] mb-3 text-sm">Price Range (SAR)</h4>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="Min" 
            defaultValue={currentMin}
            onBlur={(e) => handleUpdate("minPrice", e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
          />
          <span className="text-[var(--color-muted)]">-</span>
          <input 
            type="number" 
            placeholder="Max" 
            defaultValue={currentMax}
            onBlur={(e) => handleUpdate("maxPrice", e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
          />
        </div>
      </div>
      
      {/* Placeholder for attribute filters (Size, Color) which would ideally be dynamic based on category */}
      <div>
        <h4 className="font-semibold text-[var(--color-gray-800)] mb-3 text-sm">Attributes</h4>
        <p className="text-xs text-[var(--color-muted)]">Select options to refine.</p>
        <div className="mt-2 space-y-2">
           {/* Mock static filters for now until fully dynamic attributes are implemented */}
           <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-[var(--color-brand-navy)] rounded" />
              <span className="text-sm text-[var(--color-gray-600)]">In Stock Only</span>
            </label>
        </div>
      </div>
    </div>
  );
}
