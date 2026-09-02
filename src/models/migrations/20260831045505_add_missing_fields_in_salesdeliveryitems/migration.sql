-- DropForeignKey
ALTER TABLE "SalesSizeBreakup" DROP CONSTRAINT "SalesSizeBreakup_salesStyleBreakupId_fkey";

-- AlterTable
ALTER TABLE "SalesDeliveryItems" ADD COLUMN     "gsmId" INTEGER,
ADD COLUMN     "orderQty" TEXT;

-- AddForeignKey
ALTER TABLE "SalesDeliveryItems" ADD CONSTRAINT "SalesDeliveryItems_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "Gsm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesSizeBreakup" ADD CONSTRAINT "SalesSizeBreakup_salesStyleBreakupId_fkey" FOREIGN KEY ("salesStyleBreakupId") REFERENCES "SalesStyleBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
