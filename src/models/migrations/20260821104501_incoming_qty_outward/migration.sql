-- AlterTable
ALTER TABLE "IncomingQty" ADD COLUMN     "outwardId" INTEGER;

-- AddForeignKey
ALTER TABLE "IncomingQty" ADD CONSTRAINT "IncomingQty_outwardId_fkey" FOREIGN KEY ("outwardId") REFERENCES "ProductionOutward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
