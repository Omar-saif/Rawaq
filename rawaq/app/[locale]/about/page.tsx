import React from "react";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "@/lib/i18n/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Rawaq | رواق",
  description: "Learn about Rawaq — premium Islamic fashion and Arabic perfumes rooted in tradition.",
};

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/categories`, { next: { revalidate: 3600 } });
    return (await res.json()).data ?? [];
  } catch { return []; }
}

export default async function AboutPage() {
  const [locale, categories] = await Promise.all([getLocale(), getCategories()]);

  const values = [
    { icon: "🌿", title: locale === "ar" ? "الأصالة" : "Authenticity", desc: locale === "ar" ? "كل منتج مستوحى من الموروث الإسلامي الثري" : "Every product is rooted in rich Islamic heritage" },
    { icon: "✨", title: locale === "ar" ? "الجودة" : "Quality", desc: locale === "ar" ? "نختار فقط أفضل المواد والخامات" : "We source only the finest materials and craftsmanship" },
    { icon: "🤝", title: locale === "ar" ? "الثقة" : "Trust", desc: locale === "ar" ? "شفافية كاملة في الأسعار والمنتجات والتوصيل" : "Full transparency in pricing, products, and delivery" },
    { icon: "🌍", title: locale === "ar" ? "الانتشار" : "Reach", desc: locale === "ar" ? "نوصل لكل مكان في السعودية ودول الخليج" : "Shipping across Saudi Arabia and the Gulf" },
  ];

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[var(--color-brand-navy)] to-[#0d2a4a] py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[var(--color-brand-gold)] text-xs font-bold uppercase tracking-widest mb-4">✦ {locale === "ar" ? "قصتنا" : "Our Story"} ✦</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              {locale === "ar" ? "رواق — الأصالة والفخامة" : "Rawaq — Heritage & Luxury"}
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              {locale === "ar"
                ? "رواق هو وجهتك للأزياء الإسلامية الفاخرة والعطور العربية الأصيلة. نؤمن بأن الموضة يمكن أن تكون تعبيراً عن الهوية والتراث في آنٍ واحد."
                : "Rawaq is your destination for premium Islamic fashion and authentic Arabic fragrances. We believe fashion can be an expression of identity and heritage at the same time."}
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-white px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-[var(--color-brand-navy)]">{locale === "ar" ? "قيمنا" : "Our Values"}</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map(v => (
                <div key={v.title} className="text-center">
                  <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--color-brand-navy)]/10 flex items-center justify-center text-3xl mx-auto mb-4">{v.icon}</div>
                  <h3 className="font-bold text-[var(--color-brand-navy)] mb-2">{v.title}</h3>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[var(--color-gray-50)] text-center px-4">
          <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-4">
            {locale === "ar" ? "مستعد للتسوق؟" : "Ready to Shop?"}
          </h2>
          <p className="text-[var(--color-muted)] mb-8">{locale === "ar" ? "اكتشف مجموعتنا الفاخرة اليوم" : "Discover our premium collection today"}</p>
          <Link href="/">
            <button className="px-8 py-4 bg-[var(--color-brand-navy)] text-white font-bold rounded-[var(--radius-xl)] hover:bg-[var(--color-brand-navy-light)] transition-colors">
              {locale === "ar" ? "تسوق الآن" : "Shop Now"}
            </button>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
