import React from "react";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Rawaq",
  description: "Rawaq terms of service — usage rules, ordering, payment and returns policies.",
};

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/categories`, { next: { revalidate: 3600 } });
    return (await res.json()).data ?? [];
  } catch { return []; }
}

export default async function TermsPage() {
  const [locale, categories] = await Promise.all([getLocale(), getCategories()]);
  const updated = "1 January 2025";

  const sections = [
    {
      title: locale === "ar" ? "١. القبول والموافقة" : "1. Acceptance of Terms",
      body: locale === "ar"
        ? "باستخدامك لموقع رواق (rawaq.sa) أو تطبيقاتنا، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق على أي جزء منها، يُرجى التوقف عن استخدام المنصة."
        : "By using rawaq.sa or our applications, you agree to these Terms of Service. If you do not agree, please stop using the platform.",
    },
    {
      title: locale === "ar" ? "٢. الطلبات والمدفوعات" : "2. Orders & Payment",
      body: locale === "ar"
        ? "تتم معالجة الطلبات عبر الموقع فقط. الأسعار مقومة بالريال السعودي وتشمل ضريبة القيمة المضافة. نحتفظ بحق رفض أو إلغاء أي طلب في حالة وجود خطأ في السعر أو نفاد المخزون."
        : "Orders are processed through the site only. Prices are in Saudi Riyals and include VAT. We reserve the right to refuse or cancel any order in case of pricing errors or stock unavailability.",
    },
    {
      title: locale === "ar" ? "٣. الشحن والتوصيل" : "3. Shipping & Delivery",
      body: locale === "ar"
        ? "يتم التوصيل داخل المملكة العربية السعودية ودول الخليج. تختلف مدة التوصيل حسب المنطقة وتتراوح بين ٣–٧ أيام عمل. الشحن مجاني للطلبات التي تتجاوز ٣٠٠ ريال."
        : "Delivery is available within Saudi Arabia and Gulf countries. Delivery times vary by region and range from 3–7 business days. Free shipping on orders above 300 SAR.",
    },
    {
      title: locale === "ar" ? "٤. الإرجاع والاستبدال" : "4. Returns & Exchanges",
      body: locale === "ar"
        ? "يمكنك إرجاع المنتجات خلال ١٤ يوماً من الاستلام شريطة أن تكون في حالتها الأصلية مع غلافها وملصقاتها. لا يمكن إرجاع منتجات العطور أو الملابس الداخلية."
        : "Products may be returned within 14 days of receipt provided they are in original condition with packaging and tags. Perfumes and intimate apparel are non-returnable.",
    },
    {
      title: locale === "ar" ? "٥. الملكية الفكرية" : "5. Intellectual Property",
      body: locale === "ar"
        ? "جميع المحتويات على موقع رواق — بما فيها الشعارات والصور والنصوص — محمية بموجب قوانين حقوق الملكية الفكرية. لا يجوز إعادة استخدامها دون إذن مسبق."
        : "All content on Rawaq — including logos, images, and text — is protected by intellectual property laws. Reproduction without prior permission is prohibited.",
    },
    {
      title: locale === "ar" ? "٦. تحديد المسؤولية" : "6. Limitation of Liability",
      body: locale === "ar"
        ? "لن يكون رواق مسؤولاً عن أي أضرار غير مباشرة أو عرضية تنشأ عن استخدام منصتنا. يقتصر التزامنا على قيمة الطلب المحدد."
        : "Rawaq shall not be liable for any indirect or incidental damages arising from use of our platform. Our liability is limited to the value of the specific order.",
    },
  ];

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1 bg-[var(--color-gray-50)]">
        <div className="bg-[var(--color-brand-navy)] py-16 px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {locale === "ar" ? "شروط الخدمة" : "Terms of Service"}
          </h1>
          <p className="text-white/60 text-sm">{locale === "ar" ? `آخر تحديث: ${updated}` : `Last updated: ${updated}`}</p>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-[var(--radius-2xl)] border border-[var(--color-border)] p-8 space-y-8">
            {sections.map(s => (
              <div key={s.title}>
                <h2 className="text-lg font-bold text-[var(--color-brand-navy)] mb-2">{s.title}</h2>
                <p className="text-[var(--color-gray-600)] leading-relaxed text-sm">{s.body}</p>
              </div>
            ))}
            <div className="pt-6 border-t border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-muted)]">
                {locale === "ar"
                  ? "للاستفسار عن هذه الشروط، تواصل معنا على "
                  : "For questions about these terms, contact us at "}
                <a href="mailto:legal@rawaq.sa" className="text-[var(--color-brand-navy)] hover:underline">legal@rawaq.sa</a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
