/*
  Warnings:

  - You are about to drop the column `deliveryQty` on the `SalesDeliveryItems` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SalesBillEntryItems" ADD COLUMN     "deliveryQty" INTEGER;

-- AlterTable
ALTER TABLE "SalesDeliveryItems" DROP COLUMN "deliveryQty";
