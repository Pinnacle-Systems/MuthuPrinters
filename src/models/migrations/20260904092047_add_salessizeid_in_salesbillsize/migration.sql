-- AlterTable
ALTER TABLE "SaleBillEntrySizeBreakup" ADD COLUMN     "SalesSizeBreakupId" INTEGER;

-- AlterTable
ALTER TABLE "SalesDeliveryItems" ADD COLUMN     "deliveryQty" TEXT;

-- AddForeignKey
ALTER TABLE "SaleBillEntrySizeBreakup" ADD CONSTRAINT "SaleBillEntrySizeBreakup_SalesSizeBreakupId_fkey" FOREIGN KEY ("SalesSizeBreakupId") REFERENCES "SalesSizeBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
