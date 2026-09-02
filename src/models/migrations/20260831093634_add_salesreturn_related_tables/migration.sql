/*
  Warnings:

  - You are about to drop the column `address` on the `SalesReturn` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `SalesReturn` table. All the data in the column will be lost.
  - You are about to drop the column `place` on the `SalesReturn` table. All the data in the column will be lost.
  - You are about to drop the column `salesBillId` on the `SalesReturn` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `SalesReturn` table. All the data in the column will be lost.
  - You are about to drop the column `uomId` on the `SalesReturn` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `SalesReturnItems` table. All the data in the column will be lost.
  - You are about to drop the column `salesBillItemsId` on the `SalesReturnItems` table. All the data in the column will be lost.
  - You are about to drop the column `salesQty` on the `SalesReturnItems` table. All the data in the column will be lost.
  - You are about to drop the column `stockQty` on the `SalesReturnItems` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `SalesReturn` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SalesReturn" DROP CONSTRAINT "SalesReturn_salesBillId_fkey";

-- DropForeignKey
ALTER TABLE "SalesReturn" DROP CONSTRAINT "SalesReturn_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "SalesReturn" DROP CONSTRAINT "SalesReturn_uomId_fkey";

-- DropForeignKey
ALTER TABLE "SalesReturnItems" DROP CONSTRAINT "SalesReturnItems_productId_fkey";

-- DropForeignKey
ALTER TABLE "SalesReturnItems" DROP CONSTRAINT "SalesReturnItems_salesBillItemsId_fkey";

-- AlterTable
ALTER TABLE "Ledger" ADD COLUMN     "salesReturnId" INTEGER;

-- AlterTable
ALTER TABLE "SalesReturn" DROP COLUMN "address",
DROP COLUMN "dueDate",
DROP COLUMN "place",
DROP COLUMN "salesBillId",
DROP COLUMN "supplierId",
DROP COLUMN "uomId",
ADD COLUMN     "carriageCharge" DOUBLE PRECISION,
ADD COLUMN     "conversionType" TEXT,
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "currencyId" INTEGER,
ADD COLUMN     "customerId" INTEGER,
ADD COLUMN     "dcNo" TEXT,
ADD COLUMN     "deliveryType" TEXT,
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION,
ADD COLUMN     "docDate" DATE,
ADD COLUMN     "payTermId" INTEGER,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "salesDeliveryId" INTEGER,
ADD COLUMN     "taxTemplateId" INTEGER,
ADD COLUMN     "termsAndCondition" TEXT,
ADD COLUMN     "termsId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedById" INTEGER,
ADD COLUMN     "vehicleNo" TEXT,
ADD COLUMN     "weightInKg" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SalesReturnItems" DROP COLUMN "productId",
DROP COLUMN "salesBillItemsId",
DROP COLUMN "salesQty",
DROP COLUMN "stockQty",
ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION,
ADD COLUMN     "dozen" DOUBLE PRECISION,
ADD COLUMN     "gsmId" INTEGER,
ADD COLUMN     "hsnId" INTEGER,
ADD COLUMN     "itemGroupId" INTEGER,
ADD COLUMN     "itemSubGroupId" INTEGER,
ADD COLUMN     "labelWidth" TEXT,
ADD COLUMN     "orderQty" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "styleItemId" INTEGER,
ADD COLUMN     "taxPercent" DOUBLE PRECISION,
ADD COLUMN     "trackingType" TEXT;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "salesReturnId" INTEGER;

-- CreateTable
CREATE TABLE "SalesReturnStyleBreakup" (
    "id" SERIAL NOT NULL,
    "salesDeliveryItemId" INTEGER NOT NULL,
    "styleId" INTEGER,

    CONSTRAINT "SalesReturnStyleBreakup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReturnSizeBreakup" (
    "id" SERIAL NOT NULL,
    "salesReturnStyleBreakupId" INTEGER,
    "sizeId" INTEGER,
    "qty" TEXT,
    "returnQty" TEXT,
    "salesSizeBreakupId" INTEGER,

    CONSTRAINT "SalesReturnSizeBreakup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES "SalesReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_salesDeliveryId_fkey" FOREIGN KEY ("salesDeliveryId") REFERENCES "SalesDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_taxTemplateId_fkey" FOREIGN KEY ("taxTemplateId") REFERENCES "TaxTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_termsId_fkey" FOREIGN KEY ("termsId") REFERENCES "TermsAndConditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_payTermId_fkey" FOREIGN KEY ("payTermId") REFERENCES "PayTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItems" ADD CONSTRAINT "SalesReturnItems_styleItemId_fkey" FOREIGN KEY ("styleItemId") REFERENCES "StyleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItems" ADD CONSTRAINT "SalesReturnItems_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItems" ADD CONSTRAINT "SalesReturnItems_itemSubGroupId_fkey" FOREIGN KEY ("itemSubGroupId") REFERENCES "ItemSubGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItems" ADD CONSTRAINT "SalesReturnItems_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "Gsm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItems" ADD CONSTRAINT "SalesReturnItems_hsnId_fkey" FOREIGN KEY ("hsnId") REFERENCES "Hsn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnStyleBreakup" ADD CONSTRAINT "SalesReturnStyleBreakup_salesDeliveryItemId_fkey" FOREIGN KEY ("salesDeliveryItemId") REFERENCES "SalesDeliveryItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnStyleBreakup" ADD CONSTRAINT "SalesReturnStyleBreakup_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnSizeBreakup" ADD CONSTRAINT "SalesReturnSizeBreakup_salesReturnStyleBreakupId_fkey" FOREIGN KEY ("salesReturnStyleBreakupId") REFERENCES "SalesReturnStyleBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnSizeBreakup" ADD CONSTRAINT "SalesReturnSizeBreakup_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnSizeBreakup" ADD CONSTRAINT "SalesReturnSizeBreakup_salesSizeBreakupId_fkey" FOREIGN KEY ("salesSizeBreakupId") REFERENCES "SalesSizeBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES "SalesReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
