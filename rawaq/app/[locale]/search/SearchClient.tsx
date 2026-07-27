"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCard, ProductCardData } from "@/components/ui/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/ProductCard";
import { Input } from "@/components/ui/Input";

interface SearchClientProps { locale: string; }

export default function SearchClient({ locale }: SearchClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true); setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&pageSize=24`);
      const json = await res.json();
      setResults(json.data ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (initialQ) doSearch(initialQ); }, [initialQ, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`?q=${encodeURIComponent(query)}`, { scroll: false });
    doSearch(query);
  };

  return (
    <>
      {/* Search bar */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-4">
          {locale === "ar" ? "البحث" : "Search"}
        </h1>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <Input
              id="search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={locale === "ar" ? "ابحث عن منتجات..." : "Search for products..."}
              autoFocus
            />
          </div>
          <button type="submit" className="px-6 py-2.5 bg-[var(--color-brand-navy)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--color-brand-navy-light)] transition-colors whitespace-nowrap">
            {locale === "ar" ? "بحث" : "Search"}
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-[var(--color-gray-700)] mb-2">
            {locale === "ar" ? `لا نتائج لـ "${initialQ}"` : `No results for "${initialQ}"`}
          </h2>
          <p className="text-[var(--color-muted)]">
            {locale === "ar" ? "جرب كلمات مختلفة أو تصفح الفئات" : "Try different keywords or browse categories"}
          </p>
        </div>
      ) : results.length > 0 ? (
        <>
          <p className="text-sm text-[var(--color-muted)] mb-4">
            {results.length} {locale === "ar" ? "نتيجة" : "results"}
            {initialQ && <span> {locale === "ar" ? "لـ" : "for"} <strong>"{initialQ}"</strong></span>}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {results.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">✨</p>
          <p className="text-[var(--color-muted)]">{locale === "ar" ? "ابدأ البحث..." : "Start searching above…"}</p>
        </div>
      )}
    </>
  );
}
