"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { FB_PIXEL_ID, pageview } from "@/lib/utils/fpixel";
import { getCookieConsent } from "./CookieConsentBanner";

export function MetaPixel() {
  const [hasConsent, setHasConsent] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasFiredInit = useRef(false);

  useEffect(() => {
    const checkConsent = () => {
      setHasConsent(getCookieConsent() === "accepted");
    };
    checkConsent();
    window.addEventListener("cookieConsentChanged", checkConsent);
    return () => window.removeEventListener("cookieConsentChanged", checkConsent);
  }, []);

  useEffect(() => {
    if (!hasConsent || !FB_PIXEL_ID) return;
    if (!hasFiredInit.current) {
      hasFiredInit.current = true;
      return; // Skip first render, handled by inline script
    }
    pageview();
  }, [pathname, searchParams, hasConsent]);

  if (!hasConsent || !FB_PIXEL_ID) return null;

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
    </>
  );
}
