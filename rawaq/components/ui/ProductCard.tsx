"use client";

import React from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { PriceTag, Card, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/layout/CartContext";
import { useToast } from "@/components/ui/Modal";

export interface ProductCardData {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  images: string[];
  price: number | string;
  salePrice?: number | string | null;
  category?: { name: string; slug: string };
  variants?: Array<{ id: string; variantType: string; value: string; stockCount: number; priceModifier?: number | null }>;
  inventoryCount?: number;
}

interface ProductCardProps {
  product: ProductCardData;
}

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale();
  const { addItem, openCart } = useCart();
  const title = locale === "ar" && product.titleAr ? product.titleAr : product.title;
  const price = parseFloat(product.price.toString());
  const salePrice = product.salePrice ? parseFloat(product.salePrice.toString()) : null;
  const isOutOfStock = product.inventoryCount === 0 && (!product.variants || product.variants.every((v) => v.stockCount === 0));
  const { addToast } = useToast();
  const [addingToWishlist, setAddingToWishlist] = React.useState(false);

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToWishlist(true);
    try {
      const res = await fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.message === "Already in wishlist") {
          addToast("info", locale === "ar" ? "المنتج موجود في قائمة الأمنيات" : "Already in wishlist");
        } else {
          addToast("success", locale === "ar" ? "تمت الإضافة لقائمة الأمنيات" : "Added to wishlist");
        }
      } else {
        if (res.status === 401) {
          addToast("error", locale === "ar" ? "يجب تسجيل الدخول أولاً" : "Please login first");
        } else {
          addToast("error", locale === "ar" ? "فشلت الإضافة" : "Failed to add to wishlist");
        }
      }
    } catch {
      addToast("error", "Network error");
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      title: product.title,
      titleAr: product.titleAr,
      slug: product.slug,
      image: product.images[0] ?? "",
      price: salePrice ?? price,
      quantity: 1,
      sku: product.slug,
    });
    openCart();
  };

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <Card hover className="overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-[var(--color-gray-50)] overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-gray-200)]">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 start-2 flex flex-col gap-1 z-10">
            {salePrice && salePrice < price && <Badge variant="error">Sale</Badge>}
            {isOutOfStock && <Badge variant="gray">{locale === "ar" ? "نفد" : "Sold Out"}</Badge>}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleAddToWishlist}
            disabled={addingToWishlist}
            className="absolute top-2 end-2 z-10 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm text-[var(--color-gray-400)] hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white disabled:opacity-50"
            aria-label="Add to wishlist"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Quick add overlay */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              id={`add-to-cart-${product.slug}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full py-3 bg-[var(--color-brand-navy)] text-white text-sm font-semibold hover:bg-[var(--color-brand-navy-light)] disabled:bg-[var(--color-gray-400)] disabled:cursor-not-allowed transition-colors"
            >
              {isOutOfStock
                ? locale === "ar" ? "نفد من المخزون" : "Out of Stock"
                : locale === "ar" ? "أضف إلى السلة" : "Add to Cart"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          {product.category && (
            <p className="text-xs text-[var(--color-brand-gold)] font-semibold uppercase tracking-wide mb-1">
              {product.category.name}
            </p>
          )}
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] line-clamp-2 mb-2 group-hover:text-[var(--color-brand-navy)] transition-colors">
            {title}
          </h3>
          <PriceTag price={price} salePrice={salePrice} size="sm" locale={locale} />
        </div>
      </Card>
    </Link>
  );
}

// Grid skeleton for loading states
export function ProductCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
      <div className="skeleton aspect-[3/4]" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-5 w-24 rounded" />
      </div>
    </div>
  );
}
