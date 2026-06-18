-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "transportProductId" INTEGER;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_transportProductId_fkey" FOREIGN KEY ("transportProductId") REFERENCES "TransportProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;