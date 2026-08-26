/*
  Warnings:

  - You are about to drop the column `orderItemId` on the `OrderSizeBreakup` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrderSizeBreakup" DROP CONSTRAINT "OrderSizeBreakup_orderItemId_fkey";

-- AlterTable
ALTER TABLE "OrderSizeBreakup" DROP COLUMN "orderItemId",
ADD COLUMN     "orderStyleBreakupId" INTEGER;

-- CreateTable
CREATE TABLE "OrderStyleBreakup" (
    "id" SERIAL NOT NULL,
    "orderItemId" INTEGER,
    "styleId" INTEGER,

    CONSTRAINT "OrderStyleBreakup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderStyleBreakup" ADD CONSTRAINT "OrderStyleBreakup_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStyleBreakup" ADD CONSTRAINT "OrderStyleBreakup_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSizeBreakup" ADD CONSTRAINT "OrderSizeBreakup_orderStyleBreakupId_fkey" FOREIGN KEY ("orderStyleBreakupId") REFERENCES "OrderStyleBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
