-- DropIndex
DROP INDEX "User_email_idx";

-- CreateIndex
CREATE INDEX "Order_channel_idx" ON "Order"("channel");
