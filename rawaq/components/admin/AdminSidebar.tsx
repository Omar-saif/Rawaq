"use client";

import React from "react";
import { Link, usePathname } from "@/lib/i18n/navigation";

const NAV_GROUPS = [
  {
    label: "Store",
    items: [
      { href: "/admin",             label: "Dashboard",        icon: "📊" },
      { href: "/admin/products",    label: "Products",         icon: "🛍️" },
      { href: "/admin/categories",  label: "Categories",       icon: "📂" },
      { href: "/admin/orders",      label: "Orders",           icon: "📦" },
      { href: "/admin/coupons",     label: "Coupons",          icon: "🏷️" },
    ],
  },
  {
    label: "Storefront",
    items: [
      { href: "/admin/slides",          label: "Hero Slides",   icon: "🎞️" },
      { href: "/admin/promo-posters",   label: "Promo Posters", icon: "🖼️" },
      { href: "/admin/side-promos",     label: "Side Promos",   icon: "📢" },
      { href: "/admin/audit-log",       label: "Audit Logs",    icon: "📋" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/delivery-vendors", label: "Delivery",    icon: "🚚" },
      { href: "/account",                label: "My Account",  icon: "👤" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(href);

  return (
    <aside className="w-64 bg-[var(--color-brand-navy)] text-white flex flex-col shrink-0">
      {/* Logo / Header */}
      <div className="p-6 border-b border-white/10">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-gold)] mb-1">
          RAWAQ
        </p>
        <h1 className="text-lg font-bold">Admin Panel</h1>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-4 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as Parameters<typeof Link>[0]["href"]}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-[10px] text-white/30 text-center">Rawaq Admin v1.0</p>
      </div>
    </aside>
  );
}
