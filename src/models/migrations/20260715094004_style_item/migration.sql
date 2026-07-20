-- AlterTable
ALTER TABLE "StyleItem" ADD COLUMN     "itemSubGroupId" INTEGER;

-- AddForeignKey
ALTER TABLE "StyleItem" ADD CONSTRAINT "StyleItem_itemSubGroupId_fkey" FOREIGN KEY ("itemSubGroupId") REFERENCES "ItemSubGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
