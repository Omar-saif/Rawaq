"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/lib/i18n/navigation";
import { useCart } from "./CartContext";

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  children?: Category[];
}

interface HeaderProps {
  categories?: Category[];
}

export function Header({ categories = [] }: HeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    router.replace(pathname, { locale: newLocale });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const clothing = categories.find((c) => c.slug === "clothing");
  const perfumes = categories.find((c) => c.slug === "perfumes");

  return (
    <>
      {/* ── Top promo bar ── */}
      <div className="bg-[var(--color-brand-navy)] text-white text-xs py-2 text-center font-medium tracking-wide">
        {locale === "ar"
          ? "🌟 شحن مجاني للطلبات التي تتجاوز 300 ر.س داخل المملكة العربية السعودية"
          : "🌟 Free shipping on orders over 300 SAR within Saudi Arabia"}
      </div>

      {/* ── Main header ── */}
      <header
        className={[
          "sticky top-0 z-50 transition-all duration-300",
          scrolled 
            ? "bg-white/85 backdrop-blur-md shadow-[var(--shadow-md)] border-b border-transparent" 
            : "bg-white border-b border-[var(--color-border)]",
        ].join(" ")}
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="relative w-16 h-16 lg:w-24 lg:h-24">
                <Image
                  src="/logo.png"
                  alt="Rawaq Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors py-2 ${
                  pathname === "/en" || pathname === "/ar" || pathname === "/"
                    ? "text-[var(--color-brand-navy)] border-b-2 border-[var(--color-brand-navy)]"
                    : "text-[var(--color-gray-700)] hover:text-[var(--color-brand-navy)]"
                }`}
              >
                {t("nav.home")}
              </Link>
              {/* Mega menu trigger */}
              <div
                ref={megaRef}
                className="relative"
                onMouseEnter={() => setMegaOpen(true)}
                onMouseLeave={() => setMegaOpen(false)}
              >
                <button
                  id="mega-menu-trigger"
                  aria-expanded={megaOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-gray-700)] hover:text-[var(--color-brand-navy)] transition-colors py-2"
                >
                  {t("nav.clothing")}
                  <svg className={`w-4 h-4 transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mega Menu Dropdown */}
                {megaOpen && (
                  <div
                    className="absolute start-0 top-full mt-0 w-[580px] bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] border border-[var(--color-border)] p-6 animate-slide-down"
                    role="menu"
                    aria-label="Navigation menu"
                  >
                    <div className="grid grid-cols-2 gap-8">
                      {/* Clothing column */}
                      {clothing && (
                        <div>
                          <Link
                            href={`/category/${clothing.slug}`}
                            className="block text-xs font-bold text-[var(--color-brand-gold)] uppercase tracking-widest mb-3 hover:text-[var(--color-brand-gold-dark)]"
                          >
                            {locale === "ar" ? clothing.nameAr : clothing.name}
                          </Link>
                          <ul className="space-y-2" role="none">
                            {clothing.children?.map((sub) => (
                              <li key={sub.id} role="none">
                                <Link
                                  href={`/category/${sub.slug}`}
                                  role="menuitem"
                                  className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-brand-navy)] hover:ps-1 transition-all duration-150 block"
                                >
                                  {locale === "ar" ? sub.nameAr : sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Perfumes column */}
                      {perfumes && (
                        <div>
                          <Link
                            href={`/category/${perfumes.slug}`}
                            className="block text-xs font-bold text-[var(--color-brand-gold)] uppercase tracking-widest mb-3 hover:text-[var(--color-brand-gold-dark)]"
                          >
                            {locale === "ar" ? perfumes.nameAr : perfumes.name}
                          </Link>
                          <ul className="space-y-2" role="none">
                            {perfumes.children?.map((sub) => (
                              <li key={sub.id} role="none">
                                <Link
                                  href={`/category/${sub.slug}`}
                                  role="menuitem"
                                  className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-brand-navy)] hover:ps-1 transition-all duration-150 block"
                                >
                                  {locale === "ar" ? sub.nameAr : sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {/* Bottom CTA */}
                    <div className="mt-8 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                      <Link href="/category/clothing" className="text-xs font-semibold text-[var(--color-brand-navy)] hover:underline">
                        {locale === "ar" ? "عرض كل المنتجات ←" : "View All Products →"}
                      </Link>
                      <Link href="/category/perfumes" className="text-xs font-semibold text-[var(--color-brand-navy)] hover:underline">
                        {locale === "ar" ? "عرض كل العطور ←" : "View All Perfumes →"}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/about" className="text-sm font-medium text-[var(--color-gray-700)] hover:text-[var(--color-brand-navy)] transition-colors">
                {t("nav.about")}
              </Link>
              <Link href="/contact" className="text-sm font-medium text-[var(--color-gray-700)] hover:text-[var(--color-brand-navy)] transition-colors">
                {t("nav.contact")}
              </Link>
            </nav>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                id="header-search-btn"
                aria-label="Open search"
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-[var(--color-gray-600)] hover:text-[var(--color-brand-navy)] hover:bg-[var(--color-gray-100)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Language toggle */}
              <button
                id="locale-toggle"
                onClick={toggleLocale}
                aria-label={`Switch to ${locale === "en" ? "Arabic" : "English"}`}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-gray-600)] hover:text-[var(--color-brand-navy)] hover:bg-[var(--color-gray-100)] transition-colors border border-[var(--color-border)]"
              >
                {locale === "en" ? "عربي" : "EN"}
              </button>

              {/* Account */}
              <Link
                href="/account"
                id="header-account-btn"
                aria-label="My account"
                className="p-2 rounded-lg text-[var(--color-gray-600)] hover:text-[var(--color-brand-navy)] hover:bg-[var(--color-gray-100)] transition-colors hidden sm:flex"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>

              {/* Cart */}
              <button
                id="header-cart-btn"
                aria-label={`Cart (${itemCount} items)`}
                onClick={openCart}
                className="relative p-2 rounded-lg text-[var(--color-gray-600)] hover:text-[var(--color-brand-navy)] hover:bg-[var(--color-gray-100)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 w-5 h-5 bg-[var(--color-brand-navy)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                id="mobile-menu-btn"
                aria-label="Open mobile menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] transition-colors"
              >
                {mobileOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile nav drawer ── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[var(--color-border)] bg-white animate-slide-down">
            <div className="w-full mx-auto px-4 py-4 space-y-4">
              {/* Home */}
              <Link href="/" className="block py-2 text-[var(--color-brand-navy)] font-bold">
                {t("nav.home")}
              </Link>
              {/* Clothing accordion */}
              {clothing && (
                <MobileNavSection
                  title={locale === "ar" ? clothing.nameAr : clothing.name}
                  href={`/category/${clothing.slug}`}
                  children={clothing.children?.map((c) => ({
                    label: locale === "ar" ? c.nameAr : c.name,
                    href: `/category/${c.slug}`,
                  }))}
                />
              )}
              {perfumes && (
                <MobileNavSection
                  title={locale === "ar" ? perfumes.nameAr : perfumes.name}
                  href={`/category/${perfumes.slug}`}
                  children={perfumes.children?.map((c) => ({
                    label: locale === "ar" ? c.nameAr : c.name,
                    href: `/category/${c.slug}`,
                  }))}
                />
              )}
              <Link href="/about" className="block py-2 text-sm font-medium text-[var(--color-gray-700)]">{t("nav.about")}</Link>
              <Link href="/contact" className="block py-2 text-sm font-medium text-[var(--color-gray-700)]">{t("nav.contact")}</Link>
              <div className="flex gap-3 pt-2 border-t border-[var(--color-border)]">
                <Link href="/account" className="flex-1 text-center py-2 text-sm font-medium bg-[var(--color-gray-100)] rounded-lg">
                  {t("nav.account")}
                </Link>
                <button
                  onClick={toggleLocale}
                  className="flex-1 py-2 text-sm font-medium bg-[var(--color-brand-navy)] text-white rounded-lg"
                >
                  {locale === "en" ? "عربي" : "EN"}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Search overlay ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
        >
          <div className="w-full max-w-2xl bg-white rounded-[var(--radius-2xl)] shadow-[var(--shadow-xl)] p-6 animate-scale-in">
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === "ar" ? "ابحث عن المنتجات..." : "Search for products..."}
                className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[var(--color-brand-navy)] text-white rounded-[var(--radius-lg)] text-sm font-semibold hover:bg-[var(--color-brand-navy-light)] transition-colors"
              >
                {locale === "ar" ? "بحث" : "Search"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Mobile nav section with accordion ─────────────────────────────────────────
function MobileNavSection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children?: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href={href as Parameters<typeof Link>[0]["href"]} className="text-sm font-semibold text-[var(--color-gray-800)]">
          {title}
        </Link>
        {children && children.length > 0 && (
          <button onClick={() => setOpen(!open)} aria-expanded={open} className="p-1 text-[var(--color-gray-400)]">
            <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
      {open && children && (
        <ul className="mt-2 ms-4 space-y-2">
          {children.map((c) => (
            <li key={c.href}>
              <Link href={c.href as Parameters<typeof Link>[0]["href"]} className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-brand-navy)] block py-1">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
