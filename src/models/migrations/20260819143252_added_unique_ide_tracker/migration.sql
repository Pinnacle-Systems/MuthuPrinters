-- CreateTable
CREATE TABLE "ReworkBatchTracker" (
    "id" SERIAL NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "jobCardId" INTEGER NOT NULL,
    "processRouteId" INTEGER NOT NULL,
    "userId" INTEGER,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReworkBatchTracker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReworkBatchTracker_uniqueId_key" ON "ReworkBatchTracker"("uniqueId");

-- AddForeignKey
ALTER TABLE "ReworkBatchTracker" ADD CONSTRAINT "ReworkBatchTracker_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReworkBatchTracker" ADD CONSTRAINT "ReworkBatchTracker_processRouteId_fkey" FOREIGN KEY ("processRouteId") REFERENCES "ProcessRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReworkBatchTracker" ADD CONSTRAINT "ReworkBatchTracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
