"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface OrderLookup {
  id: string; status: string; total: number; createdAt: string;
  _count: { items: number };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800", PAID: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800", DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OrderLookupPage() {
  const locale = useLocale();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<OrderLookup | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setResult(null); setLoading(true);
    try {
      const res = await fetch(`/api/orders/lookup?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message ?? "Order not found"); return; }
      setResult(json.data);
    } finally { setLoading(false); }
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-[var(--color-gray-50)] py-16 min-h-screen">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center mx-auto mb-4 text-3xl">📦</div>
            <h1 className="text-2xl font-bold text-[var(--color-brand-navy)]">
              {locale === "ar" ? "تتبع طلبك" : "Track Your Order"}
            </h1>
            <p className="text-[var(--color-muted)] text-sm mt-2">
              {locale === "ar" ? "أدخل رقم الطلب والبريد الإلكتروني المستخدم عند الشراء" : "Enter your order ID and the email used at checkout"}
            </p>
          </div>

          <div className="bg-white rounded-[var(--radius-2xl)] border border-[var(--color-border)] p-8">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <form onSubmit={handleLookup} className="space-y-4">
              <Input id="lookup-id" label={locale === "ar" ? "رقم الطلب" : "Order ID"} value={orderId} onChange={e => setOrderId(e.target.value)} required placeholder="e.g. cmrxxx…" hint={locale === "ar" ? "يمكنك إيجاده في بريد التأكيد" : "Found in your confirmation email"} />
              <Input id="lookup-email" label={locale === "ar" ? "البريد الإلكتروني" : "Email"} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
              <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
                {locale === "ar" ? "تتبع الطلب" : "Track Order"}
              </Button>
            </form>

            {result && (
              <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                <h2 className="font-bold text-[var(--color-brand-navy)] mb-4">
                  {locale === "ar" ? "تفاصيل الطلب" : "Order Details"}
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted)]">{locale === "ar" ? "رقم الطلب" : "Order ID"}</span>
                    <span className="font-mono font-semibold">#{result.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted)]">{locale === "ar" ? "عدد المنتجات" : "Items"}</span>
                    <span>{result._count.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted)]">{locale === "ar" ? "الإجمالي" : "Total"}</span>
                    <span className="font-bold">{parseFloat(result.total.toString()).toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted)]">{locale === "ar" ? "تاريخ الطلب" : "Date"}</span>
                    <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-muted)]">{locale === "ar" ? "الحالة" : "Status"}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[result.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {result.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
