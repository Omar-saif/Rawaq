"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { useCart } from "./CartContext";
import { PriceTag } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const t = useTranslations();
  const locale = useLocale();
  const { items, coupon, subtotal, itemCount, removeItem, updateQty, closeCart, isOpen } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const discountAmount = coupon?.discountAmount ?? 0;
  const total = coupon?.newTotal ?? subtotal;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-label={t("cart.title")}
        aria-modal="true"
        className={[
          "fixed inset-y-0 end-0 z-[80] w-full max-w-md bg-white shadow-[var(--shadow-xl)]",
          "flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : locale === "ar" ? "-translate-x-full" : "translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--color-brand-navy)]">{t("cart.title")}</h2>
            {itemCount > 0 && (
              <span className="w-6 h-6 bg-[var(--color-brand-navy)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <button
            id="cart-drawer-close"
            onClick={closeCart}
            aria-label={t("buttons.close")}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-gray-100)] text-[var(--color-gray-500)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 bg-[var(--color-gray-100)] rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-[var(--color-gray-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="font-semibold text-[var(--color-gray-700)] mb-1">{t("cart.empty")}</p>
              <p className="text-sm text-[var(--color-muted)] mb-6">{t("cart.emptyDesc")}</p>
              <Button variant="primary" onClick={closeCart} fullWidth>
                {locale === "ar" ? "تصفح المنتجات" : "Browse Products"}
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item, idx) => (
                <li key={`${item.productId}-${item.variantId ?? idx}`} className="flex gap-4">
                  {/* Image */}
                  <div className="relative w-20 h-24 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-gray-100)] shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-gray-300)]">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="text-sm font-semibold text-[var(--color-foreground)] hover:text-[var(--color-brand-navy)] line-clamp-2 transition-colors"
                    >
                      {locale === "ar" && item.titleAr ? item.titleAr : item.title}
                    </Link>
                    {item.variantLabel && (
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.variantLabel}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <PriceTag price={item.price} size="sm" locale={locale} />
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => updateQty(item.productId, item.quantity - 1, item.variantId)}
                          className="w-7 h-7 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-gray-100)] text-sm transition-colors"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => updateQty(item.productId, item.quantity + 1, item.variantId)}
                          className="w-7 h-7 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-gray-100)] text-sm transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    aria-label={`Remove ${item.title}`}
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="self-start mt-1 p-1 text-[var(--color-gray-400)] hover:text-[var(--color-error)] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with totals */}
        {items.length > 0 && (
          <div className="border-t border-[var(--color-border)] px-6 py-4 space-y-3">
            {coupon && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-muted)]">{t("cart.discount")} ({coupon.code})</span>
                <span className="text-[var(--color-success)] font-medium">−{discountAmount.toFixed(2)} {locale === "ar" ? "ر.س" : "SAR"}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-muted)]">{t("cart.subtotal")}</span>
              <span className="font-bold text-[var(--color-brand-navy)] text-lg">{total.toFixed(2)} {locale === "ar" ? "ر.س" : "SAR"}</span>
            </div>
            <Link href="/cart" onClick={closeCart}>
              <Button variant="secondary" fullWidth size="md">
                {locale === "ar" ? "عرض سلة التسوق" : "View Cart"}
              </Button>
            </Link>
            <Link href="/checkout" onClick={closeCart}>
              <Button variant="primary" fullWidth size="lg">
                {t("buttons.checkout")}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
