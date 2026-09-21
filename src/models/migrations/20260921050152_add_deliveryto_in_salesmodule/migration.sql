-- AlterTable
ALTER TABLE "SalesBillEntry" ADD COLUMN     "deliveryTo" INTEGER;

-- AlterTable
ALTER TABLE "SalesDelivery" ADD COLUMN     "deliveryTo" INTEGER;

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "deliveryTo" INTEGER;

-- AddForeignKey
ALTER TABLE "SalesDelivery" ADD CONSTRAINT "SalesDelivery_deliveryTo_fkey" FOREIGN KEY ("deliveryTo") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_deliveryTo_fkey" FOREIGN KEY ("deliveryTo") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_deliveryTo_fkey" FOREIGN KEY ("deliveryTo") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;
