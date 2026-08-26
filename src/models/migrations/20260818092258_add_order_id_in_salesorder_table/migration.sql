-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "orderId" INTEGER;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
