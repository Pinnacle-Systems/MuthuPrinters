-- AlterTable
ALTER TABLE "PackingControlPanel" ADD COLUMN     "branchId" INTEGER,
ADD COLUMN     "deliveryPercentage" TEXT;

-- AlterTable
ALTER TABLE "SalesSizeBreakup" ADD COLUMN     "salesOrderSizeBreakup" INTEGER;

-- AddForeignKey
ALTER TABLE "SalesSizeBreakup" ADD CONSTRAINT "SalesSizeBreakup_salesOrderSizeBreakup_fkey" FOREIGN KEY ("salesOrderSizeBreakup") REFERENCES "SaleOrderSizeBreakup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingControlPanel" ADD CONSTRAINT "PackingControlPanel_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
