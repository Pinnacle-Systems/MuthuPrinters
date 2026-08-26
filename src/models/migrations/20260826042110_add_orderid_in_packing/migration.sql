-- AlterTable
ALTER TABLE "Packing" ADD COLUMN     "jobCardId" INTEGER;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
