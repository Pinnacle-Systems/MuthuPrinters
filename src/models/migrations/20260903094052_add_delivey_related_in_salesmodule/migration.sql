-- AlterTable
ALTER TABLE "Packing" ADD COLUMN     "finYearId" INTEGER;

-- AlterTable
ALTER TABLE "SalesDelivery" ADD COLUMN     "deliveryId" INTEGER,
ADD COLUMN     "finYearId" INTEGER,
ADD COLUMN     "loadingId" INTEGER,
ADD COLUMN     "validityTo" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "bankId" INTEGER,
ADD COLUMN     "carriageCharge" DOUBLE PRECISION,
ADD COLUMN     "carriageTax" DOUBLE PRECISION,
ADD COLUMN     "currencyId" INTEGER,
ADD COLUMN     "finYearId" INTEGER,
ADD COLUMN     "weightInKg" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "SalesDelivery" ADD CONSTRAINT "SalesDelivery_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDelivery" ADD CONSTRAINT "SalesDelivery_loadingId_fkey" FOREIGN KEY ("loadingId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDelivery" ADD CONSTRAINT "SalesDelivery_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
