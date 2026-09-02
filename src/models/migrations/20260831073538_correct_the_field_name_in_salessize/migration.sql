/*
  Warnings:

  - You are about to drop the column `salesOrderSizeBreakup` on the `SalesSizeBreakup` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SalesSizeBreakup" DROP CONSTRAINT "SalesSizeBreakup_salesOrderSizeBreakup_fkey";

-- AlterTable
ALTER TABLE "SalesSizeBreakup" DROP COLUMN "salesOrderSizeBreakup",
ADD COLUMN     "salesOrderSizeBreakupId" INTEGER;

-- AddForeignKey
ALTER TABLE "SalesSizeBreakup" ADD CONSTRAINT "SalesSizeBreakup_salesOrderSizeBreakupId_fkey" FOREIGN KEY ("salesOrderSizeBreakupId") REFERENCES "SaleOrderSizeBreakup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
