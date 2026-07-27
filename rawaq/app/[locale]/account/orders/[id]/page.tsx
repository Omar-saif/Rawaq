import React from "react";
import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getSession } from "@/lib/utils/session";
import { prisma } from "@/lib/db/prisma";
import { Link } from "@/lib/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Details | Rawaq" };

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/categories`, { next: { revalidate: 3600 } });
    return (await res.json()).data ?? [];
  } catch { return []; }
}

const statusColors: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-800",
  PAID:      "bg-blue-100 text-blue-800",
  SHIPPED:   "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};
const statusSteps = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];

type PageProps = { params: Promise<{ locale: string; id: string }> };

// shippingAddress is stored as JSON blob on Order
interface ShippingAddr {
  recipientName?: string; phone?: string;
  line1?: string; line2?: string;
  city?: string; state?: string; postalCode?: string; country?: string;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const [order, categories] = await Promise.all([
    prisma.order.findFirst({
      where: { id, userId: session.userId },
      include: {
        deliveryVendor: true,
        items: {
          include: {
            product: { select: { id: true, title: true, images: true, slug: true } },
            variant: { select: { variantType: true, value: true } },
          },
        },
      },
    }),
    getCategories(),
  ]);

  if (!order) notFound();

  const total = parseFloat(order.total.toString());
  const statusIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";
  const addr = (order.shippingAddress ?? {}) as ShippingAddr;

  const labelMap: Record<string, Record<string, string>> = {
    PENDING:   { en: "Order Placed",      ar: "تم الطلب" },
    PAID:      { en: "Payment Confirmed", ar: "تأكيد الدفع" },
    SHIPPED:   { en: "Shipped",           ar: "تم الشحن" },
    DELIVERED: { en: "Delivered",         ar: "تم التوصيل" },
  };

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1 bg-[var(--color-gray-50)] py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-6">
            <Link href="/account" className="hover:text-[var(--color-brand-navy)]">{locale === "ar" ? "حسابي" : "My Account"}</Link>
            <span>›</span>
            <Link href="/account/orders" className="hover:text-[var(--color-brand-navy)]">{locale === "ar" ? "طلباتي" : "Orders"}</Link>
            <span>›</span>
            <span className="font-mono text-[var(--color-brand-navy)]">#{id.slice(-8).toUpperCase()}</span>
          </div>

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-brand-navy)]">
                {locale === "ar" ? "تفاصيل الطلب" : "Order Details"}
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                {new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
              {order.status}
            </span>
          </div>

          {/* Progress tracker */}
          {!isCancelled && (
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-muted)] mb-6">
                {locale === "ar" ? "حالة الطلب" : "Order Status"}
              </h2>
              <div className="relative flex items-start justify-between">
                <div className="absolute top-4 start-0 end-0 h-0.5 bg-[var(--color-gray-200)] z-0">
                  <div
                    className="h-full bg-[var(--color-brand-navy)] transition-all duration-700"
                    style={{ width: statusIndex >= 0 ? `${(statusIndex / (statusSteps.length - 1)) * 100}%` : "0%" }}
                  />
                </div>
                {statusSteps.map((step, i) => {
                  const done = i <= statusIndex;
                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        done ? "bg-[var(--color-brand-navy)] border-[var(--color-brand-navy)] text-white" : "bg-white border-[var(--color-gray-300)] text-[var(--color-gray-400)]"
                      }`}>
                        {done ? "✓" : i + 1}
                      </div>
                      <p className={`text-xs text-center font-medium ${done ? "text-[var(--color-brand-navy)]" : "text-[var(--color-muted)]"}`}>
                        {labelMap[step]?.[locale] ?? step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Items */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-muted)] mb-4">
                  {locale === "ar" ? "المنتجات" : "Items"}
                </h2>
                <ul className="divide-y divide-[var(--color-border)]">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex gap-4 py-4">
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-[var(--color-gray-100)] shrink-0">
                        {item.product?.images[0] && (
                          <Image src={item.product.images[0]} alt={item.product.title} fill className="object-cover" sizes="64px" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.product?.slug ? (
                          <Link href={`/product/${item.product.slug}` as Parameters<typeof Link>[0]["href"]} className="text-sm font-semibold hover:text-[var(--color-brand-navy)] transition-colors line-clamp-2">
                            {item.product.title}
                          </Link>
                        ) : <p className="text-sm font-semibold line-clamp-2">{item.product?.title}</p>}
                        {item.variant && <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.variant.variantType}: {item.variant.value}</p>}
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">{locale === "ar" ? "الكمية" : "Qty"}: {item.quantity}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-sm font-bold text-[var(--color-brand-navy)]">
                          {(parseFloat(item.unitPrice.toString()) * item.quantity).toFixed(2)} SAR
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">{parseFloat(item.unitPrice.toString()).toFixed(2)} / {locale === "ar" ? "قطعة" : "ea."}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Shipping address */}
              {addr.line1 && (
                <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-muted)] mb-3">
                    {locale === "ar" ? "عنوان الشحن" : "Shipping Address"}
                  </h2>
                  {addr.recipientName && <p className="text-sm font-semibold">{addr.recipientName}</p>}
                  <p className="text-sm text-[var(--color-gray-600)] mt-1">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
                  </p>
                  <p className="text-sm text-[var(--color-gray-600)]">{addr.city}{addr.state ? `, ${addr.state}` : ""}</p>
                  <p className="text-sm text-[var(--color-gray-600)]">{addr.country} {addr.postalCode || ""}</p>
                  {addr.phone && <p className="text-sm text-[var(--color-gray-600)] mt-1">{addr.phone}</p>}
                </div>
              )}

              {/* Delivery Method */}
              {order.deliveryVendor && (
                <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-muted)] mb-3">
                    {locale === "ar" ? "طريقة التوصيل" : "Delivery Method"}
                  </h2>
                  <p className="text-sm font-semibold text-[var(--color-brand-navy)]">
                    {locale === "ar" && order.deliveryVendor.nameAr ? order.deliveryVendor.nameAr : order.deliveryVendor.name}
                  </p>
                  <p className="text-sm text-[var(--color-gray-600)] mt-1">
                    {locale === "ar" && order.deliveryVendor.estimatedDaysAr ? order.deliveryVendor.estimatedDaysAr : order.deliveryVendor.estimatedDays}
                  </p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-muted)] mb-4">
                  {locale === "ar" ? "ملخص السعر" : "Price Summary"}
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[var(--color-muted)]">
                    <span>{locale === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span>{parseFloat(order.subtotal.toString()).toFixed(2)} SAR</span>
                  </div>
                  {parseFloat(order.discountAmount.toString()) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{locale === "ar" ? "خصم" : "Discount"}</span>
                      <span>−{parseFloat(order.discountAmount.toString()).toFixed(2)} SAR</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[var(--color-muted)]">
                    <span>{locale === "ar" ? "الشحن" : "Shipping"}</span>
                    <span>
                      {!order.deliveryVendor || parseFloat(order.deliveryVendor.price.toString()) === 0 
                        ? (locale === "ar" ? "مجاني" : "Free") 
                        : `${parseFloat(order.deliveryVendor.price.toString()).toFixed(2)} SAR`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-3 border-t border-[var(--color-border)] text-[var(--color-brand-navy)]">
                    <span>{locale === "ar" ? "الإجمالي" : "Total"}</span>
                    <span>{total.toFixed(2)} SAR</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-1">{locale === "ar" ? "طريقة الدفع" : "Payment"}</p>
                  <p className="text-sm">💵 {locale === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery"}</p>
                </div>
              </div>

              <Link href="/account/orders" className="block">
                <button className="w-full px-4 py-2.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-gray-700)] hover:bg-[var(--color-gray-50)] transition-colors">
                  {locale === "ar" ? "← العودة للطلبات" : "← Back to Orders"}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
