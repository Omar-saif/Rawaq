"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

interface FilterSidebarProps {
  categories?: any[];
  showCategoryFilter?: boolean;
  attributeSchema?: any[];
}

export function FilterSidebar({ categories = [], showCategoryFilter = false, attributeSchema = [] }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const locale = useLocale();

  // Local state for ranges, though we apply them immediately on change for simplicity
  // or on a "Apply" button. We'll do on change.
  
  const currentCategory = searchParams.get("categorySlug") || "";
  const currentMin = searchParams.get("minPrice") || "";
  const currentMax = searchParams.get("maxPrice") || "";
  const currentAttribute = searchParams.get("attribute") || ""; // e.g. "size:52"

  
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
      
      {/* Dynamic attribute filters */}
      {attributeSchema && attributeSchema.length > 0 && (
        <div>
          <h4 className="font-semibold text-[var(--color-gray-800)] mb-3 text-sm">
            {locale === "ar" ? "المواصفات" : "Attributes"}
          </h4>
          <div className="space-y-6">
            {attributeSchema.map((attr: any) => {
              if (attr.type === "select" || attr.type === "multiselect") {
                return (
                  <div key={attr.key}>
                    <p className="text-xs font-semibold text-[var(--color-muted)] mb-2 uppercase">{attr.label}</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {attr.options?.map((opt: string) => {
                        const val = `${attr.key}:${opt}`;
                        const isChecked = currentAttribute === val;
                        return (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="attribute"
                              checked={isChecked}
                              onChange={() => handleUpdate("attribute", isChecked ? "" : val)}
                              onClick={(e) => {
                                // Allow deselecting radio
                                if (isChecked) {
                                  e.preventDefault();
                                  handleUpdate("attribute", "");
                                }
                              }}
                              className="accent-[var(--color-brand-navy)] rounded-full"
                            />
                            <span className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-brand-navy)]">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
