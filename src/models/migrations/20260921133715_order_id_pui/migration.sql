-- AlterTable
ALTER TABLE "InwardItems" ADD COLUMN     "orderEntryId" INTEGER;

-- AlterTable
ALTER TABLE "PurchaseCancel" ADD COLUMN     "finYearId" INTEGER,
ADD COLUMN     "orderEntryId" INTEGER;

-- AlterTable
ALTER TABLE "PurchaseInward" ADD COLUMN     "finYearId" INTEGER,
ADD COLUMN     "orderEntryId" INTEGER;

-- AlterTable
ALTER TABLE "PurchaseInwardReturn" ADD COLUMN     "finYearId" INTEGER,
ADD COLUMN     "orderEntryId" INTEGER;

-- AddForeignKey
ALTER TABLE "PurchaseInward" ADD CONSTRAINT "PurchaseInward_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardItems" ADD CONSTRAINT "InwardItems_orderEntryId_fkey" FOREIGN KEY ("orderEntryId") REFERENCES "OrderEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInwardReturn" ADD CONSTRAINT "PurchaseInwardReturn_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseCancel" ADD CONSTRAINT "PurchaseCancel_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
