/*
  Warnings:

  - You are about to drop the column `salesDeliveryItemId` on the `SalesSizeBreakup` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SalesSizeBreakup" DROP CONSTRAINT "SalesSizeBreakup_salesDeliveryItemId_fkey";

-- AlterTable
ALTER TABLE "SalesDelivery" ADD COLUMN     "deliveryTaxType" TEXT,
ADD COLUMN     "deliveryTaxValue" DOUBLE PRECISION,
ADD COLUMN     "isDeliveryTaxInclusive" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "deliveryCharge" INTEGER,
ADD COLUMN     "deliveryTaxType" TEXT,
ADD COLUMN     "deliveryTaxValue" DOUBLE PRECISION,
ADD COLUMN     "isDeliveryTaxInclusive" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "SalesSizeBreakup" DROP COLUMN "salesDeliveryItemId",
ADD COLUMN     "salesStyleBreakupId" INTEGER;

-- CreateTable
CREATE TABLE "SalesStyleBreakup" (
    "id" SERIAL NOT NULL,
    "salesDeliveryItemId" INTEGER NOT NULL,
    "styleId" INTEGER,

    CONSTRAINT "SalesStyleBreakup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SalesStyleBreakup" ADD CONSTRAINT "SalesStyleBreakup_salesDeliveryItemId_fkey" FOREIGN KEY ("salesDeliveryItemId") REFERENCES "SalesDeliveryItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesStyleBreakup" ADD CONSTRAINT "SalesStyleBreakup_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesSizeBreakup" ADD CONSTRAINT "SalesSizeBreakup_salesStyleBreakupId_fkey" FOREIGN KEY ("salesStyleBreakupId") REFERENCES "SalesStyleBreakup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
