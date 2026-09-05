-- AlterTable
ALTER TABLE "MobileNotification" ADD COLUMN     "machineId" INTEGER;

-- AddForeignKey
ALTER TABLE "MobileNotification" ADD CONSTRAINT "MobileNotification_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
