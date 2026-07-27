"use client";

import React from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-brand-navy)] text-white">
      {/* Gold divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-brand-gold)] to-transparent" />

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-12 h-12">
                <Image
                  src="/logo.png"
                  alt="Rawaq Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="font-bold text-white text-lg">Rawaq | رواق</div>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              {t("footer.tagline")}
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {["instagram", "twitter", "snapchat"].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[var(--color-brand-gold)] transition-colors flex items-center justify-center text-sm font-bold"
                >
                  {s[0].toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-gold)] mb-4">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/category/clothing", label: t("categories.clothing") },
                { href: "/category/perfumes", label: t("categories.perfumes") },
                { href: "/about", label: t("nav.about") },
                { href: "/contact", label: t("nav.contact") },
                { href: "/search", label: locale === "ar" ? "البحث" : "Search" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href as Parameters<typeof Link>[0]["href"]}
                    className="text-sm text-white/60 hover:text-white hover:ps-1 transition-all duration-150 block"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer service */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-gold)] mb-4">
              {t("footer.customerService")}
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/account/orders", label: t("account.orders") },
                { href: "/orders/lookup", label: locale === "ar" ? "تتبع الطلب" : "Track Order" },
                { href: "/contact", label: t("footer.contactUs") },
                { href: "/terms", label: t("footer.terms") },
                { href: "/privacy", label: t("footer.privacy") },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href as Parameters<typeof Link>[0]["href"]}
                    className="text-sm text-white/60 hover:text-white hover:ps-1 transition-all duration-150 block"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-gold)] mb-4">
              {t("footer.newsletter")}
            </h3>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              {t("footer.newsletterDesc")}
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
              <input
                type="email"
                id="newsletter-email"
                placeholder={t("footer.emailPlaceholder")}
                className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-[var(--radius-lg)] text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-gold)] focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[var(--color-brand-gold)] hover:bg-[var(--color-brand-gold-dark)] text-[var(--color-brand-navy)] font-semibold rounded-[var(--radius-lg)] text-sm transition-colors"
              >
                {t("footer.subscribe")}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            {t("footer.rights", { year })}
          </p>
          <p className="text-sm text-white/40">{t("footer.madeWith")}</p>
          {/* Payment icons placeholder */}
          <div className="flex gap-2">
            {["VISA", "MC", "STC"].map((p) => (
              <span key={p} className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold text-white/60">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
