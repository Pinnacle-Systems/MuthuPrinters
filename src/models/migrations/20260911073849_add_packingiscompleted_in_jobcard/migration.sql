/*
  Warnings:

  - You are about to drop the column `bundle` on the `PackingBreakup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "JobCard" ADD COLUMN     "isPackingComplted" TEXT;

-- AlterTable
ALTER TABLE "PackingBreakup" DROP COLUMN "bundle",
ADD COLUMN     "noOfunits" INTEGER;
