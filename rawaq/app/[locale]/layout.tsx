import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "../globals.css";
import type { Metadata } from "next";
import { CartProvider } from "@/components/layout/CartContext";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ToastProvider } from "@/components/ui/Modal";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Rawaq | رواق — Premium Islamic Fashion & Perfumes",
    template: "%s | Rawaq رواق",
  },
  description:
    "Discover premium Islamic fashion and Arabic perfumes at Rawaq. Shop Thobes, Abayas, Oud, Attar oils and more.",
  keywords: ["Islamic fashion", "Arabic perfume", "Thobes", "Abayas", "Oud", "Attar", "رواق"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Rawaq | رواق",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${notoArabic.variable}`}
    >
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider messages={messages}>
          <CartProvider>
            <ToastProvider>
              {children}
              <CartDrawer />
              <CookieConsentBanner />
            </ToastProvider>
          </CartProvider>
        </NextIntlClientProvider>
        <MetaPixel />
      </body>
    </html>
  );
}
