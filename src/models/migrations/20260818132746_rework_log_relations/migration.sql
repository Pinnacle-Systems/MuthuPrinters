-- CreateTable
CREATE TABLE "ReworkLog" (
    "id" SERIAL NOT NULL,
    "jobCardId" INTEGER,
    "processRouteId" INTEGER,
    "actualQty" INTEGER,
    "completedQty" INTEGER,
    "wastageQty" INTEGER,
    "pendingQty" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Userid" INTEGER,

    CONSTRAINT "ReworkLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReworkLog" ADD CONSTRAINT "ReworkLog_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReworkLog" ADD CONSTRAINT "ReworkLog_processRouteId_fkey" FOREIGN KEY ("processRouteId") REFERENCES "ProcessRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReworkLog" ADD CONSTRAINT "ReworkLog_Userid_fkey" FOREIGN KEY ("Userid") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
