-- AlterTable
ALTER TABLE "JobCard" ADD COLUMN     "plateSupplierId" INTEGER;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_plateSupplierId_fkey" FOREIGN KEY ("plateSupplierId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;
