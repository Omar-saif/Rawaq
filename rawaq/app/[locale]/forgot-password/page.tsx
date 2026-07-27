"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Modal";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const { addToast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { const j = await res.json(); setError(j.error?.message ?? "Failed"); return; }
      setStep("reset");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      if (!res.ok) { const j = await res.json(); setError(j.error?.message ?? "Invalid token"); return; }
      setStep("done");
    } finally { setLoading(false); }
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
          {step === "email" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--color-brand-navy)]">
                  {locale === "ar" ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                </h1>
                <p className="text-[var(--color-muted)] text-sm mt-1">
                  {locale === "ar" ? "أدخل بريدك الإلكتروني وسنرسل لك رمز إعادة التعيين" : "Enter your email and we'll send you a reset code"}
                </p>
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
              <form onSubmit={handleRequestReset} className="space-y-4">
                <Input id="forgot-email" label={locale === "ar" ? "البريد الإلكتروني" : "Email"} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
                  {locale === "ar" ? "إرسال رمز التحقق" : "Send Reset Code"}
                </Button>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">📧</div>
                <h1 className="text-2xl font-bold text-[var(--color-brand-navy)]">
                  {locale === "ar" ? "تحقق من بريدك" : "Check Your Email"}
                </h1>
                <p className="text-[var(--color-muted)] text-sm mt-1">
                  {locale === "ar" ? `أرسلنا رمز التحقق إلى ${email}` : `We sent a reset code to ${email}`}
                </p>
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input id="reset-token" label={locale === "ar" ? "رمز التحقق" : "Reset Code"} value={token} onChange={e => setToken(e.target.value)} required placeholder="Enter 6-digit code" />
                <Input id="reset-password" label={locale === "ar" ? "كلمة المرور الجديدة" : "New Password"} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required hint="Min 8 chars, uppercase & number" placeholder="••••••••" />
                <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
                  {locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                </Button>
              </form>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-2">
                {locale === "ar" ? "تم إعادة تعيين كلمة المرور!" : "Password Reset!"}
              </h1>
              <p className="text-[var(--color-muted)] text-sm mb-6">
                {locale === "ar" ? "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة" : "You can now log in with your new password"}
              </p>
              <Link href="/login">
                <Button variant="primary" fullWidth size="lg">
                  {locale === "ar" ? "تسجيل الدخول" : "Go to Login"}
                </Button>
              </Link>
            </div>
          )}

          {step !== "done" && (
            <div className="mt-6 text-center text-sm">
              <Link href="/login" className="text-[var(--color-brand-navy)] hover:underline">
                {locale === "ar" ? "← العودة لتسجيل الدخول" : "← Back to Login"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
