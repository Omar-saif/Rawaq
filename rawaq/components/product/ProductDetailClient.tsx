"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { PriceTag, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/layout/CartContext";
import { useToast } from "@/components/ui/Modal";
import { ProductLightbox } from "./ProductLightbox";
import { ProductReviews } from "./ProductReviews";

interface Variant {
  id: string;
  variantType: string;
  value: string;
  stockCount: number;
  priceModifier?: number | null;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    title: string;
    titleAr: string;
    slug: string;
    description: string;
    descriptionAr: string;
    sku: string;
    images: string[];
    price: number;
    salePrice?: number | null;
    inventoryCount: number;
    isActive: boolean;
    variants: Variant[];
    category: { id: string; name: string; nameAr: string; slug: string; attributeSchema?: any[] };
  };
}

// Group variants by variantType
function groupVariants(variants: Variant[]) {
  const groups: Record<string, Variant[]> = {};
  for (const v of variants) {
    if (!groups[v.variantType]) groups[v.variantType] = [];
    groups[v.variantType].push(v);
  }
  return groups;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const locale = useLocale();
  const t = useTranslations();
  const { addItem, openCart } = useCart();
  const { addToast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const title = locale === "ar" && product.titleAr ? product.titleAr : product.title;
  const description = locale === "ar" && product.descriptionAr ? product.descriptionAr : product.description;

  const variantGroups = groupVariants(product.variants);
  const variantTypes = Object.keys(variantGroups);

  // Determine effective price (from selected variant if applicable)
  const basePrice = product.salePrice ?? product.price;
  let effectivePrice = basePrice;
  if (variantTypes.length > 0 && variantTypes.length === Object.keys(selectedVariants).length) {
    // Find selected variant price modifier
    const firstType = variantTypes[0];
    const selVal = selectedVariants[firstType];
    const variant = variantGroups[firstType]?.find((v) => v.value === selVal);
    if (variant?.priceModifier) effectivePrice = variant.priceModifier;
  }

  // Determine stock based on selected variant
  let selectedVariantId: string | undefined;
  let inStock = product.inventoryCount > 0;
  if (Object.keys(selectedVariants).length > 0 && variantTypes.length > 0) {
    const firstType = variantTypes[0];
    const selVal = selectedVariants[firstType];
    const variant = variantGroups[firstType]?.find((v) => v.value === selVal);
    if (variant) {
      selectedVariantId = variant.id;
      inStock = variant.stockCount > 0;
    }
  }

  const allVariantsSelected = variantTypes.every((type) => selectedVariants[type]);

  const handleAddToCart = async () => {
    // Validate variant selection
    for (const type of variantTypes) {
      if (!selectedVariants[type]) {
        addToast("warning", `Please select a ${type} first`);
        return;
      }
    }
    setAdding(true);
    const variantLabel = variantTypes.map((t) => `${t}: ${selectedVariants[t]}`).join(", ");
    addItem({
      productId: product.id,
      variantId: selectedVariantId,
      title: product.title,
      titleAr: product.titleAr,
      slug: product.slug,
      image: product.images[0] ?? "",
      price: effectivePrice,
      quantity,
      variantLabel: variantLabel || undefined,
      sku: product.sku,
    });
    await new Promise((r) => setTimeout(r, 400));
    setAdding(false);
    addToast("success", locale === "ar" ? "تمت إضافة المنتج للسلة" : "Added to cart!");
    openCart();
  };

  const handleAddToWishlist = async () => {
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

  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
      {/* ── Image gallery ── */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Thumbnail strip (Desktop: Vertical, Mobile: Horizontal) */}
        {product.images.length > 1 && (
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 lg:w-24 shrink-0 order-2 lg:order-1 custom-scrollbar">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={[
                  "relative w-20 h-20 lg:w-full lg:h-24 rounded-[var(--radius-lg)] overflow-hidden shrink-0 border-2 transition-all",
                  selectedImage === i
                    ? "border-[var(--color-brand-navy)] shadow-md"
                    : "border-transparent hover:border-[var(--color-gray-300)] opacity-70 hover:opacity-100",
                ].join(" ")}
              >
                <Image src={img} alt={`Thumbnail ${i+1}`} fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div 
          className="relative flex-1 aspect-square lg:aspect-auto lg:h-[600px] rounded-[var(--radius-2xl)] overflow-hidden bg-[var(--color-gray-50)] cursor-zoom-in order-1 lg:order-2 group"
          onClick={() => setLightboxOpen(true)}
          title={locale === "ar" ? "اضغط للتكبير" : "Click to zoom"}
        >
          {product.images[selectedImage] ? (
            <Image
              src={product.images[selectedImage]}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-gray-200)]">
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {product.salePrice && (
            <div className="absolute top-4 start-4 z-10">
              <Badge variant="error">Sale</Badge>
            </div>
          )}
          {/* Zoom icon hint */}
          <div className="absolute bottom-4 end-4 w-10 h-10 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[var(--color-brand-navy)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Product info ── */}
      <div className="flex flex-col gap-6">
        {/* Category breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <Link href={`/category/${product.category.slug}`} className="hover:text-[var(--color-brand-gold)] transition-colors font-medium uppercase tracking-wide">
            {locale === "ar" ? product.category.nameAr || product.category.name : product.category.name}
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-brand-navy)] leading-tight">
          {title}
        </h1>

        {/* SKU */}
        <p className="text-xs text-[var(--color-muted)]">
          {t("product.sku")}: <span className="font-mono">{product.sku}</span>
        </p>

        {/* Price */}
        <PriceTag price={product.price} salePrice={product.salePrice} size="lg" locale={locale} />

        {/* Variant selectors */}
        {variantTypes.map((type) => (
          <div key={type}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-[var(--color-gray-700)] capitalize">
                {type}: {selectedVariants[type] && <span className="text-[var(--color-brand-navy)]">{selectedVariants[type]}</span>}
              </label>
              {type.toLowerCase().includes("size") && (
                <Link href="/size-guide" className="text-xs text-[var(--color-brand-gold)] hover:underline">
                  {t("product.sizeGuide")}
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {variantGroups[type].map((variant) => {
                const isSelected = selectedVariants[type] === variant.value;
                const oos = variant.stockCount === 0;
                return (
                  <button
                    key={variant.id}
                    onClick={() => !oos && setSelectedVariants((prev) => ({ ...prev, [type]: variant.value }))}
                    disabled={oos}
                    className={[
                      "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                      isSelected
                        ? "border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)] text-white"
                        : oos
                        ? "border-[var(--color-gray-200)] text-[var(--color-gray-300)] line-through cursor-not-allowed"
                        : "border-[var(--color-border)] text-[var(--color-gray-700)] hover:border-[var(--color-brand-navy)] hover:text-[var(--color-brand-navy)]",
                    ].join(" ")}
                  >
                    {variant.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quantity */}
        <div>
          <label className="text-sm font-semibold text-[var(--color-gray-700)] mb-3 block">
            {locale === "ar" ? "الكمية" : "Quantity"}
          </label>
          <div className="flex items-center gap-3 w-fit">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-lg border-2 border-[var(--color-border)] flex items-center justify-center text-lg hover:border-[var(--color-brand-navy)] transition-colors"
            >
              −
            </button>
            <span className="w-10 text-center text-lg font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 rounded-lg border-2 border-[var(--color-border)] flex items-center justify-center text-lg hover:border-[var(--color-brand-navy)] transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            id={`add-to-cart-${product.slug}`}
            variant="primary"
            size="lg"
            className="flex-1"
            loading={adding}
            disabled={!inStock}
            onClick={handleAddToCart}
          >
            {inStock ? t("product.addToCart") : t("product.outOfStock")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            loading={addingToWishlist}
            onClick={handleAddToWishlist}
            className="shrink-0"
            aria-label="Add to wishlist"
          >
            ❤️
          </Button>
        </div>

        {/* Stock indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-red-400"}`} />
          <span className={inStock ? "text-green-700" : "text-red-600"}>
            {inStock
              ? locale === "ar" ? "متوفر في المخزون" : "In Stock"
              : locale === "ar" ? "نفد من المخزون" : "Out of Stock"}
          </span>
        </div>

        {/* Description */}
        <div className="border-t border-[var(--color-border)] pt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-gray-500)] mb-3">
            {t("product.description")}
          </h2>
          <p className="text-sm text-[var(--color-gray-600)] leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="lg:col-span-2">
        <ProductReviews slug={product.slug} />
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && product.images.length > 0 && (
        <ProductLightbox 
          images={product.images} 
          initialIndex={selectedImage} 
          onClose={() => setLightboxOpen(false)} 
          isRtl={locale === "ar"} 
        />
      )}
    </div>
  );
}
