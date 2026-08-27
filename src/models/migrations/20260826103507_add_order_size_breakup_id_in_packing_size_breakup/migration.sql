-- AlterTable
ALTER TABLE "PackingSizeBreakup" ADD COLUMN     "orderSizeBreakupId" INTEGER;

-- AddForeignKey
ALTER TABLE "PackingSizeBreakup" ADD CONSTRAINT "PackingSizeBreakup_orderSizeBreakupId_fkey" FOREIGN KEY ("orderSizeBreakupId") REFERENCES "OrderSizeBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
