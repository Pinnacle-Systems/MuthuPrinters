/*
  Warnings:

  - You are about to drop the column `qty` on the `SalesReturnItems` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SalesReturnItems" DROP COLUMN "qty",
ADD COLUMN     "deliveryQty" DOUBLE PRECISION;
