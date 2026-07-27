"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Modal";

export default function LoginPage() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const router = useRouter();
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) setErrors({ general: json.error?.message ?? "Invalid credentials" });
        else setErrors({ general: json.error?.message ?? "Login failed" });
        return;
      }
      addToast("success", locale === "ar" ? "تم تسجيل الدخول بنجاح!" : "Logged in successfully!");
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
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 relative">
              <Image src="/logo.png" alt="Rawaq" fill className="object-contain" />
            </div>
            <span className="text-white font-bold text-2xl">Rawaq | رواق</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[var(--radius-2xl)] shadow-[var(--shadow-xl)] p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--color-brand-navy)]">{t("loginTitle")}</h1>
            <p className="text-[var(--color-muted)] text-sm mt-1">{t("loginSubtitle")}</p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="login-email"
              label={t("emailLabel")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
            <div>
              <Input
                id="login-password"
                label={t("passwordLabel")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
              <div className="mt-1 text-end">
                <Link href="/forgot-password" className="text-xs text-[var(--color-brand-navy)] hover:text-[var(--color-brand-gold)] transition-colors">
                  {t("forgotPassword")}
                </Link>
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
              {t("signIn")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--color-muted)]">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-[var(--color-brand-navy)] font-semibold hover:underline">
              {t("createAccount")}
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">
            {locale === "ar" ? "← العودة للرئيسية" : "← Back to Home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
