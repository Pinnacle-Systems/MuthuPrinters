/*
  Warnings:

  - Added the required column `currencyId` to the `SalesBillEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SalesBillEntry" ADD COLUMN     "bankId" INTEGER,
ADD COLUMN     "carriageCharge" DOUBLE PRECISION,
ADD COLUMN     "carriageTax" DOUBLE PRECISION,
ADD COLUMN     "currencyId" INTEGER NOT NULL,
ADD COLUMN     "deliveryId" INTEGER,
ADD COLUMN     "loadingId" INTEGER,
ADD COLUMN     "weightInKg" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_loadingId_fkey" FOREIGN KEY ("loadingId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
