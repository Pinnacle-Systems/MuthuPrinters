-- AlterTable
ALTER TABLE "JobCard" ADD COLUMN     "dieDescription" TEXT,
ADD COLUMN     "dieMethod" TEXT;

-- AlterTable
ALTER TABLE "PlateDetails" ADD COLUMN     "description" TEXT,
ADD COLUMN     "machineId" INTEGER,
ADD COLUMN     "plateId" INTEGER;

-- AddForeignKey
ALTER TABLE "PlateDetails" ADD CONSTRAINT "PlateDetails_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlateDetails" ADD CONSTRAINT "PlateDetails_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
