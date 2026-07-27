"use client";

import { useRouter, usePathname } from "@/lib/i18n/navigation";
import { useSearchParams } from "next/navigation";

interface SortSelectProps {
  currentSort: string;
  locale: string;
}

const SORT_OPTIONS = [
  { value: "newest",     en: "Newest First",          ar: "الأحدث أولاً" },
  { value: "price_asc",  en: "Price: Low to High",    ar: "السعر: من الأقل للأعلى" },
  { value: "price_desc", en: "Price: High to Low",    ar: "السعر: من الأعلى للأقل" },
];

export function SortSelect({ currentSort, locale }: SortSelectProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page"); // reset to page 1 on sort change
    router.push(`${pathname}?${params.toString()}` as any);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-[var(--color-muted)] whitespace-nowrap">
        {locale === "ar" ? "ترتيب حسب:" : "Sort by:"}
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={handleChange}
        className="px-3 py-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)] cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {locale === "ar" ? opt.ar : opt.en}
          </option>
        ))}
      </select>
    </div>
  );
}
