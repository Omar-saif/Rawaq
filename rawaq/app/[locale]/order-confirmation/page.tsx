import React, { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCategories } from "@/lib/data/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Confirmed | Rawaq" };


// Client component for reading searchParams
import OrderConfirmationClient from "./OrderConfirmationClient";

export default async function OrderConfirmationPage() {
  const [locale, categories] = await Promise.all([getLocale(), getCategories()]);

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1 bg-[var(--color-gray-50)] min-h-[70vh] flex items-center justify-center py-16 px-4">
        <Suspense fallback={<div className="text-center text-[var(--color-muted)]">Loading…</div>}>
          <OrderConfirmationClient locale={locale} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
