/*
  Warnings:

  - Added the required column `PackingSizeBreakupId` to the `PackingBreakup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PackingBreakup" ADD COLUMN     "PackingSizeBreakupId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "PackingBreakup" ADD CONSTRAINT "PackingBreakup_PackingSizeBreakupId_fkey" FOREIGN KEY ("PackingSizeBreakupId") REFERENCES "PackingSizeBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
