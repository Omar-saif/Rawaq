-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('WEBSITE', 'INSTAGRAM', 'WHATSAPP', 'FACEBOOK', 'TIKTOK', 'OTHER');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "channel" "SalesChannel" NOT NULL DEFAULT 'WEBSITE';
