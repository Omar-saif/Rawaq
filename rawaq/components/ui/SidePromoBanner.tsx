"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";

interface SidePromo {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
}

export function SidePromoBanner({ pageType }: { pageType: string }) {
  const [promos, setPromos] = useState<SidePromo[]>([]);

  useEffect(() => {
    async function fetchPromos() {
      try {
        const res = await fetch(`/api/side-promos?pageType=${pageType}`);
        const json = await res.json();
        setPromos(json.data ?? []);
      } catch (err) {
        console.error("Failed to load side promos", err);
      }
    }
    fetchPromos();
  }, [pageType]);

  if (promos.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {promos.map((promo) => {
        const content = (
          <div className="relative w-full aspect-[1/2] rounded-[var(--radius-xl)] overflow-hidden group border border-[var(--color-border)] shadow-sm">
            <Image
              src={promo.imageUrl}
              alt="Promotion"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>
        );

        return promo.linkUrl ? (
          <Link key={promo.id} href={promo.linkUrl} className="block w-full">
            {content}
          </Link>
        ) : (
          <div key={promo.id} className="w-full">
            {content}
          </div>
        );
      })}
    </div>
  );
}
