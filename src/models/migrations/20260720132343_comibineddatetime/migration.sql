/*
  Warnings:

  - You are about to drop the column `edDate` on the `takenmachines` table. All the data in the column will be lost.
  - You are about to drop the column `stDate` on the `takenmachines` table. All the data in the column will be lost.
  - The `edDatetime` column on the `takenmachines` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `stDatetime` column on the `takenmachines` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "takenmachines" DROP COLUMN "edDate",
DROP COLUMN "stDate",
DROP COLUMN "edDatetime",
ADD COLUMN     "edDatetime" TIMESTAMP(3),
DROP COLUMN "stDatetime",
ADD COLUMN     "stDatetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
