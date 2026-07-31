"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function getCookieConsent() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp('(^| )rawaq_cookie_consent=([^;]+)'));
  if (match) return match[2];
  return null;
}

export function setCookieConsent(value: "accepted" | "declined") {
  document.cookie = `rawaq_cookie_consent=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  // Dispatch a custom event so other components (like MetaPixel) can listen for changes
  window.dispatchEvent(new Event("cookieConsentChanged"));
}

export function CookieConsentBanner() {
  const t = useTranslations("cookieConsent");
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if consent has already been given or declined
    const consent = getCookieConsent();
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    setCookieConsent("accepted");
    setShow(false);
  };

  const handleDecline = () => {
    setCookieConsent("declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] bg-white border-t border-[var(--color-border)] shadow-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-[var(--color-gray-700)] flex-1">
        {t("message")}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleDecline}
          className="px-4 py-2 text-sm font-medium text-[var(--color-gray-500)] hover:text-[var(--color-gray-700)] transition-colors"
        >
          {t("decline")}
        </button>
        <button
          onClick={handleAccept}
          className="px-6 py-2 text-sm font-bold bg-[var(--color-brand-navy)] text-white rounded-[var(--radius-lg)] hover:bg-[var(--color-brand-navy-light)] transition-colors"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
