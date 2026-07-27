"use client";

import React from "react";
import { Decimal } from "@prisma/client/runtime/library";

// ── Badge ──────────────────────────────────────────────────────────────────────
type BadgeVariant = "navy" | "gold" | "success" | "error" | "warning" | "gray";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  navy: "bg-[var(--color-brand-navy)] text-white",
  gold: "bg-[var(--color-brand-gold)] text-[var(--color-brand-navy)]",
  success: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
  warning: "bg-amber-100 text-amber-800",
  gray: "bg-[var(--color-gray-100)] text-[var(--color-gray-700)]",
};

export function Badge({ variant = "gray", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
        badgeStyles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

// ── PriceTag ──────────────────────────────────────────────────────────────────
interface PriceTagProps {
  price: number | string | Decimal;
  salePrice?: number | string | Decimal | null;
  currency?: string;
  size?: "sm" | "md" | "lg";
  locale?: string;
}

export function PriceTag({
  price,
  salePrice,
  currency = "SAR",
  size = "md",
  locale = "en",
}: PriceTagProps) {
  const priceNum = parseFloat(price.toString());
  const salePriceNum = salePrice ? parseFloat(salePrice.toString()) : null;
  const isOnSale = salePriceNum !== null && salePriceNum < priceNum;

  const sizeMap = {
    sm: { sale: "text-base font-bold", original: "text-xs", currency: "text-xs" },
    md: { sale: "text-xl font-bold", original: "text-sm", currency: "text-sm" },
    lg: { sale: "text-3xl font-bold", original: "text-base", currency: "text-base" },
  };
  const s = sizeMap[size];

  const fmt = (val: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);

  const currencyLabel = locale === "ar" ? "ر.س" : "SAR";

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      {isOnSale ? (
        <>
          <span className={`${s.sale} text-[var(--color-brand-navy)]`}>
            {fmt(salePriceNum!)} <span className={s.currency}>{currencyLabel}</span>
          </span>
          <span className={`${s.original} text-[var(--color-muted)] line-through`}>
            {fmt(priceNum)} {currencyLabel}
          </span>
          <Badge variant="error">Sale</Badge>
        </>
      ) : (
        <span className={`${s.sale} text-[var(--color-brand-navy)]`}>
          {fmt(priceNum)} <span className={s.currency}>{currencyLabel}</span>
        </span>
      )}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        "bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden",
        hover
          ? "transition-all duration-[var(--transition-normal)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 cursor-pointer"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = "", lines }: SkeletonProps) {
  if (lines) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton h-4 rounded ${i === lines - 1 ? "w-3/4" : "w-full"}`}
          />
        ))}
      </div>
    );
  }
  return <div className={`skeleton ${className}`} />;
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-[var(--color-border)] ${className}`} />;
}
