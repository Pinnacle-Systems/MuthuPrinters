-- AlterTable
ALTER TABLE "pushLogs" ADD COLUMN     "completedQty" INTEGER DEFAULT 0,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "wastageQty" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "splitSizes" (
    "id" SERIAL NOT NULL,
    "pushLogId" INTEGER NOT NULL,
    "jobCardSizeId" INTEGER,
    "qty" INTEGER,

    CONSTRAINT "splitSizes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "splitSizes" ADD CONSTRAINT "splitSizes_pushLogId_fkey" FOREIGN KEY ("pushLogId") REFERENCES "pushLogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "splitSizes" ADD CONSTRAINT "splitSizes_jobCardSizeId_fkey" FOREIGN KEY ("jobCardSizeId") REFERENCES "JobCardSizeBreakup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
