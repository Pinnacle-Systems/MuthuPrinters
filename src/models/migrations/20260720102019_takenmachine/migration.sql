-- CreateTable
CREATE TABLE "takenmachines" (
    "id" SERIAL NOT NULL,
    "Userid" INTEGER NOT NULL,
    "jobCardId" INTEGER,
    "processRouteId" INTEGER,
    "Datetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departmentid" INTEGER NOT NULL,
    "Machineid" INTEGER NOT NULL,

    CONSTRAINT "takenmachines_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "takenmachines" ADD CONSTRAINT "takenmachines_Userid_fkey" FOREIGN KEY ("Userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "takenmachines" ADD CONSTRAINT "takenmachines_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "takenmachines" ADD CONSTRAINT "takenmachines_processRouteId_fkey" FOREIGN KEY ("processRouteId") REFERENCES "ProcessRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "takenmachines" ADD CONSTRAINT "takenmachines_departmentid_fkey" FOREIGN KEY ("departmentid") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "takenmachines" ADD CONSTRAINT "takenmachines_Machineid_fkey" FOREIGN KEY ("Machineid") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
