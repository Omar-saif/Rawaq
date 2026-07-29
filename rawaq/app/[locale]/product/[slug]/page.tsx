import React from "react";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { SidePromoBanner } from "@/components/ui/SidePromoBanner";
import { getProductBySlug, getRelatedProducts, getCategories } from "@/lib/data/server";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.title} | Rawaq`,
    description: product.description?.slice(0, 160) ?? `Shop ${product.title} at Rawaq.`,
    openGraph: {
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const [product, categories] = await Promise.all([getProductBySlug(slug), getCategories()]);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product.categoryId, slug);

  // Normalize numeric fields from Prisma (Decimal → number)
  const normalized = {
    ...product,
    price: parseFloat(product.price.toString()),
    salePrice: product.salePrice ? parseFloat(product.salePrice.toString()) : null,
    variants: product.variants.map((v: any) => ({
      ...v,
      priceModifier: v.priceModifier ? parseFloat(v.priceModifier.toString()) : null,
    })),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: locale === "ar" && product.titleAr ? product.titleAr : product.title,
    description: locale === "ar" && product.descriptionAr ? product.descriptionAr : product.description,
    image: product.images?.[0] ? [product.images[0]] : [],
    offers: {
      "@type": "Offer",
      price: normalized.salePrice ?? normalized.price,
      priceCurrency: "SAR",
      availability: normalized.inventoryCount > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header categories={categories} />
      <main className="flex-1 bg-white">
        {/* Breadcrumb */}
        <div className="bg-[var(--color-gray-50)] border-b border-[var(--color-border)]">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <a href={`/${locale}`} className="hover:text-[var(--color-brand-navy)] transition-colors">
              {locale === "ar" ? "الرئيسية" : "Home"}
            </a>
            <span>›</span>
            <a href={`/${locale}/category/${product.category?.slug}`} className="hover:text-[var(--color-brand-navy)] transition-colors">
              {locale === "ar" ? product.category?.nameAr || product.category?.name : product.category?.name}
            </a>
            <span>›</span>
            <span className="text-[var(--color-brand-navy)] font-medium line-clamp-1">
              {locale === "ar" && product.titleAr ? product.titleAr : product.title}
            </span>
          </div>
        </div>

        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <ProductDetailClient product={normalized as any} />
            </div>
            
            {/* Sidebar Promo */}
            <aside className="w-full lg:w-64 shrink-0 mt-8 lg:mt-0">
              <SidePromoBanner pageType="product" />
            </aside>
          </div>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <RelatedProducts 
              initialProducts={relatedProducts} 
              categoryId={product.categoryId} 
              currentSlug={slug} 
              locale={locale} 
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
