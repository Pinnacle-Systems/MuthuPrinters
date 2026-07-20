/*
  Warnings:

  - You are about to drop the column `Date` on the `takenmachines` table. All the data in the column will be lost.
  - You are about to drop the column `Datetime` on the `takenmachines` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "takenmachines" DROP COLUMN "Date",
DROP COLUMN "Datetime",
ADD COLUMN     "edDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "edDatetime" TIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stDatetime" TIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
