"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Modal";

export default function ContactPage() {
  const locale = useLocale();
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const setField = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      addToast("warning", locale === "ar" ? "الرجاء ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }
    setSending(true);
    // Simulate send (replace with actual email API when ready)
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    addToast("success", locale === "ar" ? "تم إرسال رسالتك بنجاح!" : "Message sent successfully!");
  };

  const contacts = [
    { icon: "📧", label: locale === "ar" ? "البريد الإلكتروني" : "Email", value: "support@rawaq.sa", href: "mailto:support@rawaq.sa" },
    { icon: "📱", label: locale === "ar" ? "واتساب" : "WhatsApp", value: "+966 5X XXX XXXX", href: "https://wa.me/966500000000" },
    { icon: "🕐", label: locale === "ar" ? "ساعات العمل" : "Working Hours", value: locale === "ar" ? "الأحد – الخميس · 9ص – 6م" : "Sun – Thu · 9AM – 6PM", href: undefined },
    { icon: "📍", label: locale === "ar" ? "المقر" : "Location", value: locale === "ar" ? "دكا، بنغلاديش" : "Dhaka, Bangladesh", href: undefined },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[var(--color-brand-navy)] to-[#0d2a4a] py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[var(--color-brand-gold)] text-xs font-bold uppercase tracking-widest mb-4">✦ {locale === "ar" ? "تواصل معنا" : "Get in Touch"} ✦</p>
            <h1 className="text-4xl font-bold text-white mb-4">
              {locale === "ar" ? "كيف يمكننا مساعدتك؟" : "How Can We Help You?"}
            </h1>
            <p className="text-white/70 text-lg">
              {locale === "ar"
                ? "فريق رواق دائماً هنا للإجابة على استفساراتك"
                : "The Rawaq team is always here to answer your questions"}
            </p>
          </div>
        </section>

        <section className="py-16 bg-[var(--color-gray-50)] px-4">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-start">

            {/* Contact info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">
                {locale === "ar" ? "معلومات التواصل" : "Contact Information"}
              </h2>
              <div className="space-y-4">
                {contacts.map(c => (
                  <div key={c.label} className="flex items-start gap-4 bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-5">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center text-lg shrink-0">{c.icon}</div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)] mb-0.5">{c.label}</p>
                      {c.href ? (
                        <a href={c.href} className="text-sm font-medium text-[var(--color-brand-navy)] hover:underline">{c.value}</a>
                      ) : (
                        <p className="text-sm font-medium text-[var(--color-foreground)]">{c.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[var(--color-brand-navy)] rounded-[var(--radius-xl)] p-6 text-white">
                <p className="text-[var(--color-brand-gold)] text-xs font-bold uppercase tracking-wider mb-2">
                  {locale === "ar" ? "تتبع طلبك" : "Track Your Order"}
                </p>
                <p className="text-sm text-white/80 mb-4">
                  {locale === "ar" ? "يمكنك تتبع طلبك بدون تسجيل دخول" : "Track your order without logging in"}
                </p>
                <a href={`/${locale}/orders/lookup`}
                  className="inline-block px-5 py-2.5 bg-[var(--color-brand-gold)] text-[var(--color-brand-navy)] font-bold rounded-lg text-sm hover:bg-[var(--color-brand-gold-light)] transition-colors">
                  {locale === "ar" ? "تتبع الطلب →" : "Track Order →"}
                </a>
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-white rounded-[var(--radius-2xl)] border border-[var(--color-border)] p-8">
              {sent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
                  <h3 className="text-xl font-bold text-[var(--color-brand-navy)] mb-2">
                    {locale === "ar" ? "تم الإرسال!" : "Message Sent!"}
                  </h3>
                  <p className="text-[var(--color-muted)] text-sm mb-6">
                    {locale === "ar" ? "سنرد عليك في أقرب وقت ممكن، عادةً خلال 24 ساعة" : "We'll get back to you soon, usually within 24 hours"}
                  </p>
                  <Button variant="outline-gold" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                    {locale === "ar" ? "إرسال رسالة أخرى" : "Send Another"}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-[var(--color-brand-navy)] mb-2">
                    {locale === "ar" ? "أرسل لنا رسالة" : "Send Us a Message"}
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Input id="contact-name" label={locale === "ar" ? "الاسم *" : "Name *"} value={form.name} onChange={e => setField("name", e.target.value)} required placeholder="Ahmed" />
                    <Input id="contact-email" label={locale === "ar" ? "البريد الإلكتروني *" : "Email *"} type="email" value={form.email} onChange={e => setField("email", e.target.value)} required placeholder="you@example.com" />
                  </div>
                  <Input id="contact-subject" label={locale === "ar" ? "الموضوع" : "Subject"} value={form.subject} onChange={e => setField("subject", e.target.value)} placeholder={locale === "ar" ? "استفسار عن طلب..." : "Order inquiry..."} />
                  <Textarea id="contact-message" label={locale === "ar" ? "رسالتك *" : "Message *"} value={form.message} onChange={e => setField("message", e.target.value)} required rows={5} placeholder={locale === "ar" ? "اكتب رسالتك هنا..." : "Write your message here..."} />
                  <Button type="submit" variant="primary" fullWidth size="lg" loading={sending}>
                    {locale === "ar" ? "إرسال الرسالة" : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
