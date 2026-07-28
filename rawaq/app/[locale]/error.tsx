"use client";

import React, { useEffect } from "react";
import { Link } from "@/lib/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const isRTL = locale === "ar";

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-gray-50)] px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-[var(--radius-xl)] shadow-sm border border-[var(--color-border)]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 text-3xl">
          !
        </div>
        
        <h1 className="text-2xl font-bold text-[var(--color-brand-navy)]">
          {isRTL ? "عذراً، حدث خطأ ما" : "Oops, something went wrong"}
        </h1>
        
        <p className="text-[var(--color-muted)] text-sm">
          {isRTL 
            ? "لقد واجهنا مشكلة غير متوقعة. يرجى المحاولة مرة أخرى أو العودة إلى الصفحة الرئيسية." 
            : "We encountered an unexpected issue. Please try again or return to the home page."}
        </p>
        
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-[var(--color-brand-navy)] text-white font-medium rounded-xl hover:bg-[var(--color-brand-navy)]/90 transition-colors"
          >
            {isRTL ? "حاول مرة أخرى" : "Try Again"}
          </button>
          
          <Link
            href="/"
            className="px-6 py-3 bg-[var(--color-gray-100)] text-[var(--color-brand-navy)] font-medium rounded-xl hover:bg-[var(--color-gray-200)] transition-colors"
          >
            {t("home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
