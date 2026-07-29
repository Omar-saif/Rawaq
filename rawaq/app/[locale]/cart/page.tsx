"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { useCart } from "@/components/layout/CartContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PriceTag } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Modal";
import { SidePromoBanner } from "@/components/ui/SidePromoBanner";

function CouponInput() {
  const { items, subtotal, applyCoupon, removeCoupon, coupon } = useCart();
  const { addToast } = useToast();
  const locale = useLocale();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          cartSubtotal: subtotal,
          cartItems: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast("error", json.error?.message ?? "Invalid coupon");
        removeCoupon();
      } else {
        applyCoupon(json.data.coupon.code, json.data.discountAmount, json.data.newTotal);
        addToast("success", locale === "ar" ? "تم تطبيق الكوبون!" : "Coupon applied!");
      }
    } catch {
      addToast("error", "Failed to validate coupon");
    } finally {
      setLoading(false);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-[var(--radius-lg)] px-4 py-3">
        <div>
          <span className="text-green-800 font-semibold text-sm">{coupon.code}</span>
          <p className="text-green-600 text-xs mt-0.5">
            {locale === "ar" ? "تم تطبيق الخصم" : "Discount applied"} — −{coupon.discountAmount.toFixed(2)} SAR
          </p>
        </div>
        <button onClick={removeCoupon} className="text-green-700 hover:text-red-600 text-xs underline transition-colors">
          {locale === "ar" ? "إزالة" : "Remove"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        id="coupon-input"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && handleApply()}
        placeholder={locale === "ar" ? "كود الخصم" : "Coupon code"}
        className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)] uppercase"
      />
      <Button variant="outline-gold" size="md" loading={loading} onClick={handleApply}>
        {locale === "ar" ? "تطبيق" : "Apply"}
      </Button>
    </div>
  );
}

export default function CartPage() {
  const locale = useLocale();
  const t = useTranslations();
  const { items, subtotal, coupon, updateQty, removeItem, clearCart, itemCount, loading } = useCart();

  const discountAmount = coupon?.discountAmount ?? 0;
  const total = coupon?.newTotal ?? subtotal;

  if (loading) {
    return (
      <main className="flex-1 bg-[var(--color-gray-50)] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex gap-5">
                  <div className="w-24 h-28 bg-gray-200 rounded-lg shrink-0" />
                  <div className="flex-1 py-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 h-64" />
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <main className="flex-1 bg-[var(--color-gray-50)] flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-24 h-24 bg-[var(--color-gray-100)] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-[var(--color-gray-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-2">{t("cart.empty")}</h1>
            <p className="text-[var(--color-muted)] mb-8">{t("cart.emptyDesc")}</p>
            <Link href="/">
              <Button variant="primary" size="lg">
                {locale === "ar" ? "تصفح المنتجات" : "Browse Products"}
              </Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="flex-1 bg-[var(--color-gray-50)] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-brand-navy)]">{t("cart.title")}</h1>
            <span className="text-sm text-[var(--color-muted)]">
              {itemCount} {locale === "ar" ? "عنصر" : "items"}
            </span>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items list */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, idx) => (
                <div
                  key={`${item.productId}-${item.variantId ?? idx}`}
                  className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-5 flex gap-5"
                >
                  {/* Image */}
                  <div className="relative w-24 h-28 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-gray-50)] shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-gray-300)]">📦</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.slug}`} className="font-semibold text-[var(--color-foreground)] hover:text-[var(--color-brand-navy)] line-clamp-2 transition-colors">
                      {locale === "ar" && item.titleAr ? item.titleAr : item.title}
                    </Link>
                    {item.variantLabel && <p className="text-xs text-[var(--color-muted)] mt-1">{item.variantLabel}</p>}
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                      <PriceTag price={item.price} size="sm" locale={locale} />
                      {/* Qty control */}
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.productId, item.quantity - 1, item.variantId)} className="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-gray-100)] transition-colors text-sm">−</button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, item.quantity + 1, item.variantId)} className="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-gray-100)] transition-colors text-sm">+</button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-[var(--color-brand-navy)]">
                        {(item.price * item.quantity).toFixed(2)} {locale === "ar" ? "ر.س" : "SAR"}
                      </span>
                      <button onClick={() => removeItem(item.productId, item.variantId)} className="text-xs text-[var(--color-muted)] hover:text-[var(--color-error)] transition-colors">
                        {t("buttons.removeItem")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={clearCart} className="text-sm text-[var(--color-muted)] hover:text-[var(--color-error)] transition-colors">
                {locale === "ar" ? "مسح السلة" : "Clear Cart"}
              </button>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 h-fit space-y-4 sticky top-24">
              <h2 className="text-lg font-bold text-[var(--color-brand-navy)]">{t("checkout.orderSummary")}</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">{t("cart.subtotal")}</span>
                  <span>{subtotal.toFixed(2)} {locale === "ar" ? "ر.س" : "SAR"}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-[var(--color-success)]">
                    <span>{locale === "ar" ? "خصم" : "Discount"} ({coupon.code})</span>
                    <span>−{discountAmount.toFixed(2)} {locale === "ar" ? "ر.س" : "SAR"}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-[var(--color-border)]">
                  <span>{t("cart.total")}</span>
                  <span className="text-[var(--color-brand-navy)]">{total.toFixed(2)} {locale === "ar" ? "ر.س" : "SAR"}</span>
                </div>
              </div>

              <CouponInput />

              <Link href="/checkout">
                <Button variant="primary" fullWidth size="lg">
                  {t("buttons.checkout")}
                </Button>
              </Link>
              <Link href="/" className="block text-center text-sm text-[var(--color-muted)] hover:text-[var(--color-brand-navy)] transition-colors">
                {locale === "ar" ? "← متابعة التسوق" : "← Continue Shopping"}
              </Link>
            </div>
            
            <div className="mt-6">
              <SidePromoBanner pageType="cart" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
