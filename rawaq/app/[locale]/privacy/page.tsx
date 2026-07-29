import React from "react";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCategories } from "@/lib/data/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Rawaq",
  description: "Rawaq privacy policy — how we collect, use, and protect your data.",
};


export default async function PrivacyPage() {
  const [locale, categories] = await Promise.all([getLocale(), getCategories()]);
  const updated = "1 January 2025";

  const sections = [
    {
      title: locale === "ar" ? "١. البيانات التي نجمعها" : "1. Data We Collect",
      body: locale === "ar"
        ? "نجمع المعلومات التالية: الاسم، البريد الإلكتروني، رقم الجوال، عنوان التوصيل، وتاريخ الطلبات. لا نجمع معلومات بطاقات الدفع — جميع المدفوعات تتم عند الاستلام."
        : "We collect: name, email, phone, shipping address, and order history. We do not collect payment card information — all payments are cash on delivery.",
    },
    {
      title: locale === "ar" ? "٢. كيف نستخدم بياناتك" : "2. How We Use Your Data",
      body: locale === "ar"
        ? "تُستخدم بياناتك لمعالجة الطلبات، التواصل بشأن حالة التوصيل، تحسين تجربتك في التسوق، وإرسال العروض الترويجية (يمكنك إلغاء الاشتراك في أي وقت)."
        : "Your data is used to process orders, communicate about delivery status, improve your shopping experience, and send promotional offers (you can unsubscribe at any time).",
    },
    {
      title: locale === "ar" ? "٣. مشاركة البيانات" : "3. Data Sharing",
      body: locale === "ar"
        ? "لا نبيع بياناتك لأطراف ثالثة. نشارك فقط ما هو ضروري مع شركاء الشحن لأغراض التوصيل. جميع الشركاء ملتزمون بنفس مستوى سرية البيانات."
        : "We do not sell your data to third parties. We share only what is necessary with shipping partners for delivery purposes. All partners are bound by the same data confidentiality standards.",
    },
    {
      title: locale === "ar" ? "٤. أمان البيانات" : "4. Data Security",
      body: locale === "ar"
        ? "نستخدم تشفير SSL وكلمات مرور مُشفرة (bcrypt) لحماية بياناتك. يتم تخزين جميع البيانات على خوادم آمنة محمية."
        : "We use SSL encryption and hashed passwords (bcrypt) to protect your data. All data is stored on secure, protected servers.",
    },
    {
      title: locale === "ar" ? "٥. ملفات تعريف الارتباط" : "5. Cookies",
      body: locale === "ar"
        ? "نستخدم ملفات تعريف الارتباط لحفظ جلسة الدخول وعناصر السلة. يمكنك تعطيل ملفات تعريف الارتباط في إعدادات متصفحك، لكن ذلك قد يؤثر على بعض وظائف الموقع."
        : "We use cookies to save login sessions and cart items. You can disable cookies in your browser settings, though this may affect some site functionality.",
    },
    {
      title: locale === "ar" ? "٦. حقوقك" : "6. Your Rights",
      body: locale === "ar"
        ? "يحق لك طلب الوصول إلى بياناتك الشخصية، تصحيحها، أو حذفها. لممارسة هذه الحقوق، تواصل معنا عبر privacy@rawaq.sa"
        : "You have the right to request access to, correction of, or deletion of your personal data. To exercise these rights, contact us at privacy@rawaq.sa",
    },
  ];

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1 bg-[var(--color-gray-50)]">
        <div className="bg-[var(--color-brand-navy)] py-16 px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {locale === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
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
                {locale === "ar" ? "للاستفسار، تواصل معنا على " : "For questions, contact us at "}
                <a href="mailto:privacy@rawaq.sa" className="text-[var(--color-brand-navy)] hover:underline">privacy@rawaq.sa</a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
