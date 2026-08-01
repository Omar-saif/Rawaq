"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Modal";

function VerifyOtpContent() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailQuery = searchParams.get("email");
  const { addToast } = useToast();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if no email in URL
  useEffect(() => {
    if (!emailQuery) {
      router.push("/login");
    }
  }, [emailQuery, router]);

  // Handle countdown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailQuery) return;
    if (code.length !== 6) {
      setError(locale === "ar" ? "يجب أن يتكون الرمز من 6 أرقام" : "Code must be 6 digits");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailQuery, code }),
      });
      const json = await res.json();
      
      if (!res.ok) {
        if (json.error?.code === "OTP_EXPIRED") {
          setError(locale === "ar" ? "انتهت صلاحية الرمز. يرجى طلب رمز جديد." : "Code expired. Please request a new one.");
        } else if (json.error?.code === "OTP_MAX_ATTEMPTS") {
          setError(locale === "ar" ? "لقد تجاوزت الحد الأقصى للمحاولات. يرجى طلب رمز جديد." : "Too many attempts. Please request a new code.");
        } else {
          setError(json.error?.message ?? "Verification failed");
        }
        return;
      }
      
      addToast("success", locale === "ar" ? "تم التحقق من حسابك بنجاح!" : "Account verified successfully!");
      router.push("/account");
    } catch {
      setError(locale === "ar" ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailQuery || cooldown > 0 || resendLoading) return;
    
    setError(null);
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailQuery }),
      });
      const json = await res.json();
      
      if (!res.ok) {
        setError(json.error?.message ?? "Failed to resend code");
        return;
      }
      
      addToast("success", locale === "ar" ? "تم إرسال رمز جديد إلى بريدك الإلكتروني" : "A new code has been sent to your email");
      setCooldown(60); // 60 seconds cooldown
    } catch {
      setError(locale === "ar" ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "An error occurred. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (!emailQuery) return null;

  return (
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
          <h1 className="text-2xl font-bold text-[var(--color-brand-navy)]">
            {locale === "ar" ? "التحقق من البريد الإلكتروني" : "Verify Email"}
          </h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            {locale === "ar" 
              ? `أدخل الرمز المكون من 6 أرقام المرسل إلى ${emailQuery}` 
              : `Enter the 6-digit code sent to ${emailQuery}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            id="verify-code"
            label={locale === "ar" ? "رمز التحقق" : "Verification Code"}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            placeholder="123456"
            className="text-center text-2xl tracking-widest font-mono"
            maxLength={6}
          />

          <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
            {locale === "ar" ? "التحقق والمتابعة" : "Verify & Continue"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-[var(--color-muted)] mb-2">
            {locale === "ar" ? "لم تستلم الرمز؟" : "Didn't receive the code?"}
          </p>
          <button 
            onClick={handleResend}
            disabled={cooldown > 0 || resendLoading}
            className={`font-semibold transition-colors ${
              cooldown > 0 
                ? "text-[var(--color-gray-400)] cursor-not-allowed" 
                : "text-[var(--color-brand-navy)] hover:underline"
            }`}
          >
            {resendLoading 
              ? (locale === "ar" ? "جاري الإرسال..." : "Sending...") 
              : cooldown > 0 
                ? (locale === "ar" ? `إعادة الإرسال بعد ${cooldown}ث` : `Resend in ${cooldown}s`)
                : (locale === "ar" ? "إعادة إرسال الرمز" : "Resend code")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--color-brand-navy)] to-[#0d2a4a] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <VerifyOtpContent />
      </Suspense>
    </main>
  );
}
