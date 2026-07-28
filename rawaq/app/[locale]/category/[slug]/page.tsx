import React from "react";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, ProductCardData } from "@/components/ui/ProductCard";
import { SortSelect } from "@/components/product/SortSelect";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import { SidePromoBanner } from "@/components/ui/SidePromoBanner";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

interface CategoryNode {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  children?: CategoryNode[];
}

async function getCategory(slug: string): Promise<CategoryNode | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const cats: CategoryNode[] = json.data ?? [];
    // Find in top-level or children
    for (const cat of cats) {
      if (cat.slug === slug) return cat;
      if (cat.children) {
        const sub = cat.children.find((c) => c.slug === slug);
        if (sub) return sub;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function getProducts(slug: string, searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  params.set("categorySlug", slug);
  if (searchParams.sort) params.set("sort", searchParams.sort);
  if (searchParams.minPrice) params.set("minPrice", searchParams.minPrice);
  if (searchParams.maxPrice) params.set("maxPrice", searchParams.maxPrice);
  if (searchParams.attribute) params.set("attribute", searchParams.attribute);
  if (searchParams.page) params.set("page", searchParams.page);
  params.set("pageSize", "24");

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products?${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { products: [], total: 0, totalPages: 1 };
    const json = await res.json();
    return {
      products: (json.data ?? []) as ProductCardData[],
      total: json.meta?.total ?? 0,
      totalPages: json.meta?.totalPages ?? 1,
    };
  } catch {
    return { products: [], total: 0, totalPages: 1 };
  }
}

async function getAllCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/categories`, { next: { revalidate: 3600 } });
    const json = await res.json();
    return json.data ?? [];
  } catch { return []; }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category Not Found" };
  return {
    title: `${category.name} | Rawaq`,
    description: `Shop ${category.name} at Rawaq — premium Islamic fashion and Arabic perfumes.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const locale = await getLocale();

  const [category, { products, total, totalPages }, allCategories] = await Promise.all([
    getCategory(slug),
    getProducts(slug, resolvedSearchParams),
    getAllCategories(),
  ]);

  if (!category) notFound();

  const page = parseInt(resolvedSearchParams.page ?? "1");
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
              <FilterSidebar />
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
