-- AlterTable
ALTER TABLE "OrderEntry" ADD COLUMN     "deliveryId" INTEGER,
ADD COLUMN     "loadingId" INTEGER;

-- AddForeignKey
ALTER TABLE "OrderEntry" ADD CONSTRAINT "OrderEntry_loadingId_fkey" FOREIGN KEY ("loadingId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEntry" ADD CONSTRAINT "OrderEntry_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
