import React, { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SearchClient from "./SearchClient";
import { getCategories } from "@/lib/data/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search | Rawaq", description: "Search Islamic fashion and Arabic perfumes at Rawaq" };


export default async function SearchPage() {
  const [locale, categories] = await Promise.all([getLocale(), getCategories()]);
  return (
    <>
      <Header categories={categories} />
      <main className="flex-1 bg-[var(--color-gray-50)] py-10 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="text-center py-20 text-[var(--color-muted)]">Searching…</div>}>
            <SearchClient locale={locale} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
