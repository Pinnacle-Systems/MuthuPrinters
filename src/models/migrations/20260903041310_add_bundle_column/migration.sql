/*
  Warnings:

  - You are about to drop the column `quantity` on the `PackingBreakup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PackingBreakup" DROP COLUMN "quantity",
ADD COLUMN     "bundle" INTEGER,
ADD COLUMN     "qty" INTEGER;
