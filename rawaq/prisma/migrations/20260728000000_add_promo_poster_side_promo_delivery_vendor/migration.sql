-- Migration: add_promo_poster_side_promo_delivery_vendor
-- Generated manually to match what was applied to production via `prisma db push`.
-- All statements are purely additive (CREATE TABLE, ADD COLUMN) — nothing drops or recreates existing objects.

-- ── PromoPoster ───────────────────────────────────────────────────────────────
CREATE TABLE "PromoPoster" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoPoster_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PromoPoster_isActive_sortOrder_idx" ON "PromoPoster"("isActive", "sortOrder");
CREATE INDEX "PromoPoster_startsAt_endsAt_idx" ON "PromoPoster"("startsAt", "endsAt");

-- ── SidePromo ─────────────────────────────────────────────────────────────────
CREATE TABLE "SidePromo" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetPages" TEXT[],
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SidePromo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SidePromo_isActive_idx" ON "SidePromo"("isActive");

-- ── DeliveryVendor ────────────────────────────────────────────────────────────
CREATE TABLE "DeliveryVendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "estimatedDays" TEXT NOT NULL,
    "estimatedDaysAr" TEXT NOT NULL DEFAULT '',
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryVendor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeliveryVendor_isActive_idx" ON "DeliveryVendor"("isActive");

-- ── Order.deliveryVendorId ────────────────────────────────────────────────────
ALTER TABLE "Order" ADD COLUMN "deliveryVendorId" TEXT;

ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryVendorId_fkey"
    FOREIGN KEY ("deliveryVendorId")
    REFERENCES "DeliveryVendor"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
