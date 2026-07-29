import React from "react";
import { getLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCategories } from "@/lib/data/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page Not Found | Rawaq" };


export default async function NotFoundPage() {
  const [locale, categories] = await Promise.all([getLocale(), getCategories()]);
  return (
    <>
      <Header categories={categories} />
      <main className="flex-1 bg-[var(--color-gray-50)] flex items-center justify-center py-20 px-4">
        <div className="text-center max-w-md">
          <div className="text-[120px] leading-none font-black text-[var(--color-brand-navy)]/10 select-none mb-4">404</div>
          <h1 className="text-3xl font-bold text-[var(--color-brand-navy)] mb-3">
            {locale === "ar" ? "الصفحة غير موجودة" : "Page Not Found"}
          </h1>
          <p className="text-[var(--color-muted)] mb-8">
            {locale === "ar"
              ? "الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
              : "The page you're looking for doesn't exist or has been moved."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <button className="px-6 py-3 bg-[var(--color-brand-navy)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--color-brand-navy-light)] transition-colors">
                {locale === "ar" ? "← العودة للرئيسية" : "← Go Home"}
              </button>
            </Link>
            <Link href="/search">
              <button className="px-6 py-3 border border-[var(--color-border)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--color-gray-100)] transition-colors">
                {locale === "ar" ? "البحث" : "Search"}
              </button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
