import { MetadataRoute } from "next";
import { env } from "../lib/env";

const BASE_URL = env.NEXT_PUBLIC_APP_URL ?? "https://rawaq.sa";
const LOCALES = ["en", "ar"];

async function getProducts() {
  try {
    const res = await fetch(`${BASE_URL}/api/products?pageSize=500`, { next: { revalidate: 3600 } });
    return (await res.json()).data ?? [];
  } catch { return []; }
}

async function getCategories() {
  try {
    const res = await fetch(`${BASE_URL}/api/categories`, { next: { revalidate: 3600 } });
    return (await res.json()).data ?? [];
  } catch { return []; }
}

interface CategoryNode {
  slug: string;
  children?: CategoryNode[];
}

function flatten(cats: CategoryNode[]): CategoryNode[] {
  return cats.flatMap((c) => [c, ...flatten(c.children ?? [])]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, cats] = await Promise.all([getProducts(), getCategories()]);
  const categories = flatten(cats);

  const staticRoutes = [
    { path: "", priority: 1.0, changeFreq: "daily" as const },
    { path: "/about", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/terms", priority: 0.4, changeFreq: "yearly" as const },
    { path: "/privacy", priority: 0.4, changeFreq: "yearly" as const },
    { path: "/orders/lookup", priority: 0.5, changeFreq: "yearly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages for both locales
  for (const locale of LOCALES) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${BASE_URL}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFreq,
        priority: route.priority,
      });
    }
  }

  // Category pages
  for (const cat of categories) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  // Product pages
  for (const product of products) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}/product/${product.slug}`,
        lastModified: new Date(product.updatedAt ?? Date.now()),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
  }

  return entries;
}
