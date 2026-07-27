"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Modal";

export default function RegisterPage() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const router = useRouter();
  const { addToast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error?.details) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(json.error.details).forEach(([field, msgs]: [string, any]) => {
            fieldErrors[field] = Array.isArray(msgs) ? msgs[0] : msgs;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: json.error?.message ?? "Registration failed" });
        }
        return;
      }
      addToast("success", locale === "ar" ? "تم إنشاء حسابك بنجاح!" : "Account created successfully!");
      router.push("/account");
    } catch {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--color-brand-navy)] to-[#0d2a4a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 relative">
              <Image src="/logo.png" alt="Rawaq" fill className="object-contain" />
            </div>
            <span className="text-white font-bold text-2xl">Rawaq | رواق</span>
          </Link>
        </div>

        <div className="bg-white rounded-[var(--radius-2xl)] shadow-[var(--shadow-xl)] p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--color-brand-navy)]">{t("registerTitle")}</h1>
            <p className="text-[var(--color-muted)] text-sm mt-1">{t("registerSubtitle")}</p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="register-name"
              label={t("nameLabel")}
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              error={errors.name}
              required
              autoComplete="name"
              placeholder={locale === "ar" ? "الاسم الكامل" : "Your full name"}
            />
            <Input
              id="register-email"
              label={t("emailLabel")}
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              error={errors.email}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
            <Input
              id="register-phone"
              label={locale === "ar" ? "رقم الجوال (اختياري)" : "Phone (optional)"}
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              autoComplete="tel"
              placeholder="+966 5X XXX XXXX"
            />
            <Input
              id="register-password"
              label={t("passwordLabel")}
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              error={errors.password}
              required
              autoComplete="new-password"
              hint={locale === "ar" ? "8 أحرف على الأقل، حرف كبير ورقم" : "Min 8 chars with uppercase & number"}
              placeholder="••••••••"
            />

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
              {t("createAccount")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--color-muted)]">
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-[var(--color-brand-navy)] font-semibold hover:underline">
              {t("signIn")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
