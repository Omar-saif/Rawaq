import React from "react";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, ProductCardData } from "@/components/ui/ProductCard";
import { SortSelect } from "@/components/product/SortSelect";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import { SidePromoBanner } from "@/components/ui/SidePromoBanner";
import { getCategoryBySlug, getProducts, getCategories } from "@/lib/data/server";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const category = await getCategoryBySlug(slug);
  
  if (!category) return { title: "Category Not Found" };
  
  const title = locale === "ar" && (category as any).nameAr ? (category as any).nameAr : category.name;
  return {
    title: `${title} | Rawaq`,
    description: `Shop the latest ${title} products at Rawaq.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const locale = await getLocale();

  const sort = (resolvedSearchParams.sort ?? "newest") as "newest" | "price_asc" | "price_desc";
  const page = parseInt(resolvedSearchParams.page ?? "1");

  const [category, { products, total, totalPages }, allCategories] = await Promise.all([
    getCategoryBySlug(slug),
    getProducts({
      categorySlug: slug,
      sort,
      minPrice: resolvedSearchParams.minPrice ? parseFloat(resolvedSearchParams.minPrice) : undefined,
      maxPrice: resolvedSearchParams.maxPrice ? parseFloat(resolvedSearchParams.maxPrice) : undefined,
      attribute: resolvedSearchParams.attribute,
      page,
      pageSize: 24,
    }),
    getCategories(),
  ]);

  if (!category) notFound();

  const currentSort = resolvedSearchParams.sort ?? "newest";

  return (
    <>
      <Header categories={allCategories} />
      <main className="flex-1 bg-[var(--color-gray-50)] min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-[var(--color-border)]">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <a href={`/${locale}`} className="hover:text-[var(--color-brand-navy)] transition-colors">
              {locale === "ar" ? "الرئيسية" : "Home"}
            </a>
            <span>›</span>
            <span className="text-[var(--color-brand-navy)] font-medium">
              {locale === "ar" ? category.nameAr || category.name : category.name}
            </span>
          </div>
        </div>

        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-brand-navy)]">
                {locale === "ar" ? category.nameAr || category.name : category.name}
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                {total} {locale === "ar" ? "منتج" : "products"}
              </p>
            </div>

            {/* Sort control — client component to avoid onChange in Server Component */}
            <SortSelect currentSort={currentSort} locale={locale} />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar (Filters + Promos) */}
            <aside className="w-full lg:w-64 shrink-0 space-y-6">
              <FilterSidebar attributeSchema={category.attributeSchema as any} />
              <SidePromoBanner pageType="category" />
            </aside>

            {/* Main Content (Products grid) */}
            <div className="flex-1">
              {products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-sm">
                  <p className="text-2xl mb-2">🔍</p>
                  <h2 className="text-xl font-semibold text-[var(--color-gray-700)] mb-2">
                    {locale === "ar" ? "لا توجد منتجات" : "No products found"}
                  </h2>
                  <p className="text-[var(--color-muted)]">
                    {locale === "ar" ? "حاول تغيير الفلاتر" : "Try adjusting your filters"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${resolvedSearchParams.sort ? `&sort=${resolvedSearchParams.sort}` : ""}`}
                  className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-gray-100)] transition-colors"
                >
                  {locale === "ar" ? "← السابق" : "← Prev"}
                </a>
              )}
              <span className="text-sm text-[var(--color-muted)]">
                {locale === "ar" ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              {page < totalPages && (
                <a
                  href={`?page=${page + 1}${resolvedSearchParams.sort ? `&sort=${resolvedSearchParams.sort}` : ""}`}
                  className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-gray-100)] transition-colors"
                >
                  {locale === "ar" ? "التالي →" : "Next →"}
                </a>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
