/*
  Warnings:

  - You are about to drop the column `qty` on the `SaleBillEntrySizeBreakup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SaleBillEntrySizeBreakup" DROP COLUMN "qty",
ADD COLUMN     "billQty" INTEGER,
ADD COLUMN     "deliveryQty" INTEGER;
