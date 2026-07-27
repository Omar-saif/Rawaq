"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/Button";

interface OrderConfirmationClientProps {
  locale: string;
}

export default function OrderConfirmationClient({ locale }: OrderConfirmationClientProps) {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const email = searchParams.get("email");
  const [tick, setTick] = useState(false);

  useEffect(() => {
    // Small delay for animation
    const t = setTimeout(() => setTick(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="max-w-lg w-full text-center">
      {/* Success icon */}
      <div className={`w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8 transition-all duration-700 ${tick ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
        <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className={`transition-all duration-700 delay-200 ${tick ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
        <h1 className="text-3xl font-bold text-[var(--color-brand-navy)] mb-2">
          {locale === "ar" ? "🎉 تم تأكيد طلبك!" : "🎉 Order Confirmed!"}
        </h1>
        <p className="text-[var(--color-muted)] mb-4">
          {locale === "ar"
            ? "شكراً لك! سنتواصل معك قريباً لتأكيد موعد التوصيل."
            : "Thank you! We'll contact you soon to confirm your delivery."}
        </p>

        {orderId && (
          <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--color-muted)]">
                {locale === "ar" ? "رقم الطلب" : "Order ID"}
              </span>
              <span className="font-mono text-sm font-bold text-[var(--color-brand-navy)]">
                #{orderId.slice(-8).toUpperCase()}
              </span>
            </div>
            {email && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-muted)]">
                  {locale === "ar" ? "تأكيد على" : "Confirmation to"}
                </span>
                <span className="text-sm text-[var(--color-foreground)]">{email}</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-[var(--color-brand-navy)]/5 rounded-[var(--radius-xl)] p-5 mb-8 text-sm text-[var(--color-gray-600)] text-left space-y-2">
          <div className="flex items-center gap-3">
            <span>📦</span>
            <span>{locale === "ar" ? "طلبك قيد المعالجة وسيتم شحنه قريباً" : "Your order is being processed and will be shipped soon"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>💵</span>
            <span>{locale === "ar" ? "الدفع عند الاستلام — ادفع عند وصول طلبك" : "Cash on delivery — pay when your order arrives"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>📞</span>
            <span>{locale === "ar" ? "سيتصل بك فريقنا خلال 24 ساعة لتأكيد الطلب" : "Our team will call you within 24 hours to confirm"}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && (
            <Link href={`/account/orders/${orderId}`}>
              <Button variant="primary" size="lg">
                {locale === "ar" ? "تتبع طلبي" : "Track Order"}
              </Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="secondary" size="lg">
              {locale === "ar" ? "متابعة التسوق" : "Continue Shopping"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
