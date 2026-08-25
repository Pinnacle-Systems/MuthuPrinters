-- CreateTable
CREATE TABLE "IncomingQty" (
    "id" SERIAL NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "jobCardId" INTEGER NOT NULL,
    "processRouteId" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "qty" INTEGER NOT NULL,
    "sendRoute" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomingQty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncomingQty_uniqueId_key" ON "IncomingQty"("uniqueId");

-- AddForeignKey
ALTER TABLE "IncomingQty" ADD CONSTRAINT "IncomingQty_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingQty" ADD CONSTRAINT "IncomingQty_processRouteId_fkey" FOREIGN KEY ("processRouteId") REFERENCES "ProcessRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingQty" ADD CONSTRAINT "IncomingQty_sendRoute_fkey" FOREIGN KEY ("sendRoute") REFERENCES "ProcessRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
