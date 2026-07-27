import React from "react";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getSession } from "@/lib/utils/session";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "@/lib/i18n/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Account | Rawaq" };

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/categories`, { next: { revalidate: 3600 } });
    return (await res.json()).data ?? [];
  } catch { return []; }
}

export default async function AccountPage() {
  const locale = await getLocale();
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const [user, orders, categories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true, role: true },
    }),
    prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, status: true, total: true, createdAt: true, _count: { select: { items: true } } },
    }),
    getCategories(),
  ]);

  if (!user) redirect(`/${locale}/login`);

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    PAID: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const statusLabels: Record<string, string> = {
    PENDING: locale === "ar" ? "قيد الانتظار" : "Pending",
    PAID: locale === "ar" ? "مدفوع" : "Paid",
    SHIPPED: locale === "ar" ? "تم الشحن" : "Shipped",
    DELIVERED: locale === "ar" ? "تم التوصيل" : "Delivered",
    CANCELLED: locale === "ar" ? "ملغي" : "Cancelled",
  };

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1 bg-[var(--color-gray-50)] py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--color-brand-navy)] to-[#0d2a4a] rounded-[var(--radius-2xl)] p-8 mb-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[var(--color-brand-gold)]/20 rounded-full flex items-center justify-center text-2xl font-bold text-[var(--color-brand-gold)]">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-white/70 text-sm">{user.email}</p>
                {user.role === "ADMIN" && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--color-brand-gold)] text-[var(--color-brand-navy)] text-xs font-bold rounded-full">
                    {locale === "ar" ? "مدير" : "Admin"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Sidebar nav */}
            <div className="space-y-2">
              {[
                { href: "/account", label: locale === "ar" ? "نظرة عامة" : "Overview", icon: "👤" },
                { href: "/account/orders", label: locale === "ar" ? "طلباتي" : "My Orders", icon: "📦" },
                { href: "/account/addresses", label: locale === "ar" ? "عناويني" : "Addresses", icon: "📍" },
                ...(user.role === "ADMIN" ? [{ href: "/admin", label: locale === "ar" ? "لوحة الإدارة" : "Admin Panel", icon: "⚙️" }] : []),
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href as Parameters<typeof Link>[0]["href"]}
                  className="flex items-center gap-3 px-4 py-3 bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-gray-700)] hover:text-[var(--color-brand-navy)] hover:border-[var(--color-brand-navy)]/30 hover:bg-[var(--color-brand-navy)]/5 transition-all"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {/* Logout */}
              <form action="/api/auth/me" method="POST">
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-error)] hover:bg-red-50 transition-all"
                >
                  <span>🚪</span>
                  {locale === "ar" ? "تسجيل الخروج" : "Sign Out"}
                </button>
              </form>
            </div>

            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-5 text-center">
                  <p className="text-3xl font-bold text-[var(--color-brand-navy)]">{orders.length}</p>
                  <p className="text-sm text-[var(--color-muted)] mt-1">{locale === "ar" ? "إجمالي الطلبات" : "Total Orders"}</p>
                </div>
                <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-5 text-center">
                  <p className="text-3xl font-bold text-[var(--color-brand-navy)]">
                    {orders.reduce((sum, o) => sum + parseFloat(o.total.toString()), 0).toFixed(0)}
                  </p>
                  <p className="text-sm text-[var(--color-muted)] mt-1">{locale === "ar" ? "إجمالي الإنفاق (ر.س)" : "Total Spent (SAR)"}</p>
                </div>
              </div>

              {/* Recent orders */}
              <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-[var(--color-brand-navy)]">{locale === "ar" ? "أحدث الطلبات" : "Recent Orders"}</h2>
                  <Link href="/account/orders" className="text-xs text-[var(--color-brand-navy)] hover:underline">
                    {locale === "ar" ? "عرض الكل" : "View All"}
                  </Link>
                </div>
                {orders.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)] text-center py-4">
                    {locale === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--color-border)]">
                    {orders.map((order) => (
                      <li key={order.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-foreground)]">#{order.id.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-[var(--color-muted)]">
                            {order._count.items} {locale === "ar" ? "عناصر" : "items"} •{" "}
                            {new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status] ?? ""}`}>
                            {statusLabels[order.status] ?? order.status}
                          </span>
                          <span className="text-sm font-bold text-[var(--color-brand-navy)]">
                            {parseFloat(order.total.toString()).toFixed(2)} SAR
                          </span>
                          <Link href={`/account/orders/${order.id}`} className="text-xs text-[var(--color-brand-navy)] hover:underline">
                            {locale === "ar" ? "تفاصيل" : "View"}
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
