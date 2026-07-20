-- AlterTable
ALTER TABLE "JobCard" ADD COLUMN     "isCancelled" BOOLEAN DEFAULT false,
ADD COLUMN     "isHold" BOOLEAN DEFAULT false;
