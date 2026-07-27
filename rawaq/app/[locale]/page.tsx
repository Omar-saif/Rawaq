import React from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, ProductCardData } from "@/components/ui/ProductCard";
import { HeroSlider, SlideData } from "@/components/ui/HeroSlider";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rawaq | رواق — Premium Islamic Fashion & Arabic Perfumes",
  description:
    "Shop the finest Thobes, Abayas, Oud, and Attar at Rawaq. Premium Islamic fashion and Arabic perfumes, crafted with tradition.",
};

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function getFeaturedProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/products?sort=newest&pageSize=8`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function getSlides(): Promise<SlideData[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/slides`, {
      next: { revalidate: 60 }, // revalidate every 60s so schedule changes take effect quickly
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function getPromoPosters() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/promo-posters`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const [categories, featuredProducts, slides, promoPosters] = await Promise.all([
    getCategories(), getFeaturedProducts(), getSlides(), getPromoPosters(),
  ]);

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1">

        {/* ── HERO SECTION — managed from /admin/slides ── */}
        <HeroSlider slides={slides} />


        {/* ── PROMO POSTERS ── */}
        {promoPosters.length > 0 && (
          <section className="py-20 bg-white">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promoPosters.map((poster: any) => {
                  const content = (
                    <div className="relative w-full aspect-[4/5] rounded-[var(--radius-2xl)] overflow-hidden group">
                      <Image
                        src={poster.imageUrl}
                        alt="Promotion"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                    </div>
                  );
                  return poster.linkUrl ? (
                    <a key={poster.id} href={poster.linkUrl} className="block">
                      {content}
                    </a>
                  ) : (
                    <div key={poster.id}>{content}</div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── FEATURED PRODUCTS ── */}
        <section className="py-20 bg-[var(--color-gray-50)]">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-gold)] mb-2">
                  {locale === "ar" ? "مميز" : "Featured"}
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-brand-navy)]">
                  {locale === "ar" ? "المنتجات المميزة" : "Featured Products"}
                </h2>
              </div>
              <Link
                href="/category/clothing"
                className="text-sm font-semibold text-[var(--color-brand-navy)] hover:text-[var(--color-brand-gold)] transition-colors underline underline-offset-4 hidden sm:block"
              >
                {locale === "ar" ? "عرض الكل →" : "View All →"}
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product: ProductCardData) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Mobile view all */}
            <div className="mt-8 text-center sm:hidden">
              <Link href="/category/clothing">
                <button className="px-8 py-3 border-2 border-[var(--color-brand-navy)] text-[var(--color-brand-navy)] font-semibold rounded-[var(--radius-xl)] hover:bg-[var(--color-brand-navy)] hover:text-white transition-all">
                  {locale === "ar" ? "عرض جميع المنتجات" : "View All Products"}
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── PROMOTIONAL BANNER ── */}
        <section className="py-20 bg-white">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[var(--radius-2xl)] overflow-hidden bg-gradient-to-r from-[var(--color-brand-navy)] to-[#0d2a4a] p-12 lg:p-16 text-center">
              {/* Gold shimmer decoration */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-gold)] to-transparent" />
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-gold)] to-transparent" />

              <div className="relative z-10">
                <span className="inline-block text-4xl mb-4">✦</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  {locale === "ar" ? "مجموعة العطور الملكية" : "Royal Perfume Collection"}
                </h2>
                <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                  {locale === "ar"
                    ? "اكتشف أرقى العطور العربية من عود وعطر وأو دو بارفان. روائح تسحر وتبقى."
                    : "Discover our finest Arabic fragrances — Oud, Attar, and Eau de Parfum. Scents that captivate and endure."}
                </p>
                <Link href="/category/perfumes">
                  <button className="px-10 py-4 bg-[var(--color-brand-gold)] text-[var(--color-brand-navy)] font-bold rounded-[var(--radius-xl)] hover:bg-[var(--color-brand-gold-light)] transition-all hover:shadow-lg hover:shadow-[var(--color-brand-gold)]/30 text-lg">
                    {locale === "ar" ? "اكتشف المجموعة" : "Explore Collection"}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY RAWAQ ── */}
        <section className="py-20 bg-[var(--color-gray-50)]">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[var(--color-brand-navy)]">
                {locale === "ar" ? "لماذا رواق؟" : "Why Choose Rawaq?"}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "🕌", title: locale === "ar" ? "مستوحى من التراث" : "Heritage Inspired", desc: locale === "ar" ? "تصاميم متجذرة في الثقافة الإسلامية الأصيلة" : "Designs rooted in authentic Islamic culture" },
                { icon: "⭐", title: locale === "ar" ? "جودة فائقة" : "Premium Quality", desc: locale === "ar" ? "أقمشة وخامات مختارة بعناية من أجود المصادر" : "Carefully selected premium fabrics and materials" },
                { icon: "🚚", title: locale === "ar" ? "شحن سريع" : "Fast Shipping", desc: locale === "ar" ? "توصيل داخل المملكة خلال ٢-٣ أيام عمل" : "Delivery within Saudi Arabia in 2-3 business days" },
                { icon: "💎", title: locale === "ar" ? "خدمة متميزة" : "Premium Service", desc: locale === "ar" ? "دعم عملاء على مدار الساعة بخبرة وإتقان" : "Round-the-clock customer support with expertise" },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-[var(--radius-2xl)] p-6 text-center hover:shadow-[var(--shadow-md)] transition-shadow border border-[var(--color-border)]">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="font-bold text-[var(--color-brand-navy)] mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
