/*
  Warnings:

  - You are about to drop the column `saleOrderId` on the `SaleOrderSizeBreakup` table. All the data in the column will be lost.
  - Added the required column `saleStyleBreakupId` to the `SaleOrderSizeBreakup` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SaleOrderSizeBreakup" DROP CONSTRAINT "SaleOrderSizeBreakup_saleOrderId_fkey";

-- AlterTable
ALTER TABLE "SaleOrderSizeBreakup" DROP COLUMN "saleOrderId",
ADD COLUMN     "saleStyleBreakupId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "SaleOrderStyleBreakup" (
    "id" SERIAL NOT NULL,
    "salesItemId" INTEGER NOT NULL,
    "styleId" INTEGER,

    CONSTRAINT "SaleOrderStyleBreakup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SaleOrderStyleBreakup" ADD CONSTRAINT "SaleOrderStyleBreakup_salesItemId_fkey" FOREIGN KEY ("salesItemId") REFERENCES "SalesOrderItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderStyleBreakup" ADD CONSTRAINT "SaleOrderStyleBreakup_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderSizeBreakup" ADD CONSTRAINT "SaleOrderSizeBreakup_saleStyleBreakupId_fkey" FOREIGN KEY ("saleStyleBreakupId") REFERENCES "SaleOrderStyleBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
