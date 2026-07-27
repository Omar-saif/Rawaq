// This root layout is intentionally minimal.
// All <html>, <body>, fonts, and providers live in app/[locale]/layout.tsx
// which handles locale-specific rendering (dir, lang, RTL fonts, providers).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
