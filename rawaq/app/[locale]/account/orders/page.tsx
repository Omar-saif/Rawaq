import React from "react";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getSession } from "@/lib/utils/session";
import { prisma } from "@/lib/db/prisma";
import { Link } from "@/lib/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Orders | Rawaq" };

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/categories`, { next: { revalidate: 3600 } });
    return (await res.json()).data ?? [];
  } catch { return []; }
}

const statusColors: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-800 border-amber-200",
  PAID:      "bg-blue-100 text-blue-800 border-blue-200",
  SHIPPED:   "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};
const statusLabels: Record<string, Record<string, string>> = {
  PENDING:   { en: "Pending",   ar: "قيد الانتظار" },
  PAID:      { en: "Paid",      ar: "مدفوع" },
  SHIPPED:   { en: "Shipped",   ar: "تم الشحن" },
  DELIVERED: { en: "Delivered", ar: "تم التوصيل" },
  CANCELLED: { en: "Cancelled", ar: "ملغي" },
};

export default async function OrdersPage() {
  const locale = await getLocale();
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const [orders, categories] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          take: 1,
          include: { product: { select: { images: true, title: true } } },
        },
        _count: { select: { items: true } },
      },
    }),
    getCategories(),
  ]);

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1 bg-[var(--color-gray-50)] py-10 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/account" className="text-[var(--color-muted)] hover:text-[var(--color-brand-navy)] transition-colors text-sm">
              {locale === "ar" ? "← حسابي" : "← My Account"}
            </Link>
            <h1 className="text-2xl font-bold text-[var(--color-brand-navy)]">
              {locale === "ar" ? "طلباتي" : "My Orders"}
            </h1>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-[var(--radius-2xl)] border border-[var(--color-border)] p-16 text-center">
              <p className="text-5xl mb-4">📦</p>
              <h2 className="text-xl font-bold text-[var(--color-gray-700)] mb-2">
                {locale === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}
              </h2>
              <p className="text-[var(--color-muted)] mb-6">
                {locale === "ar" ? "ابدأ التسوق واستمتع بتجربة رواق الفريدة" : "Start shopping and experience the Rawaq difference"}
              </p>
              <Link href="/">
                <button className="px-6 py-3 bg-[var(--color-brand-navy)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--color-brand-navy-light)] transition-colors">
                  {locale === "ar" ? "تسوق الآن" : "Shop Now"}
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const firstProduct = order.items[0]?.product;
                const statusKey = order.status as keyof typeof statusColors;
                return (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}` as Parameters<typeof Link>[0]["href"]}
                    className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-5 flex gap-5 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-navy)]/20 transition-all group"
                  >
                    {/* Product thumbnail */}
                    <div className="relative w-20 h-24 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-gray-100)] shrink-0">
                      {firstProduct?.images[0] ? (
                        <img src={firstProduct.images[0]} alt={firstProduct.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      )}
                    </div>

                    {/* Order details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-mono text-xs text-[var(--color-muted)]">#{order.id.slice(-8).toUpperCase()}</p>
                          <p className="text-sm font-semibold mt-1 text-[var(--color-foreground)]">
                            {order._count.items} {locale === "ar" ? "عنصر" : order._count.items === 1 ? "item" : "items"}
                          </p>
                          <p className="text-xs text-[var(--color-muted)] mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[statusKey] ?? "bg-gray-100 text-gray-600"}`}>
                          {(statusLabels[order.status]?.[locale] ?? order.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-base font-bold text-[var(--color-brand-navy)]">
                          {parseFloat(order.total.toString()).toFixed(2)} {locale === "ar" ? "ر.س" : "SAR"}
                        </p>
                        <span className="text-xs text-[var(--color-brand-navy)] group-hover:underline font-medium">
                          {locale === "ar" ? "عرض التفاصيل ←" : "View Details →"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
