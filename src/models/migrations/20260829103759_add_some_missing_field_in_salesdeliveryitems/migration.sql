-- AlterTable
ALTER TABLE "SalesDeliveryItems" ADD COLUMN     "dozen" DOUBLE PRECISION,
ADD COLUMN     "itemGroupId" INTEGER,
ADD COLUMN     "itemSubGroupId" INTEGER,
ADD COLUMN     "labelWidth" TEXT;

-- AddForeignKey
ALTER TABLE "SalesDeliveryItems" ADD CONSTRAINT "SalesDeliveryItems_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDeliveryItems" ADD CONSTRAINT "SalesDeliveryItems_itemSubGroupId_fkey" FOREIGN KEY ("itemSubGroupId") REFERENCES "ItemSubGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
