-- AlterTable
ALTER TABLE "OrderItems" ADD COLUMN     "itemSubGroupId" INTEGER,
ADD COLUMN     "labelWidth" TEXT;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_itemSubGroupId_fkey" FOREIGN KEY ("itemSubGroupId") REFERENCES "ItemSubGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
