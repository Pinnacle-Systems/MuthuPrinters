/*
  Warnings:

  - You are about to drop the column `salesDeliveryItemId` on the `SalesReturnStyleBreakup` table. All the data in the column will be lost.
  - Added the required column `salesReturnItemsId` to the `SalesReturnStyleBreakup` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SalesReturnStyleBreakup" DROP CONSTRAINT "SalesReturnStyleBreakup_salesDeliveryItemId_fkey";

-- AlterTable
ALTER TABLE "SalesReturnStyleBreakup" DROP COLUMN "salesDeliveryItemId",
ADD COLUMN     "salesReturnItemsId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SalesReturnStyleBreakup" ADD CONSTRAINT "SalesReturnStyleBreakup_salesReturnItemsId_fkey" FOREIGN KEY ("salesReturnItemsId") REFERENCES "SalesReturnItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
