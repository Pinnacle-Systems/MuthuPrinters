/*
  Warnings:

  - You are about to drop the column `ProformaInvoiceItemId` on the `PISizeBreakup` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PISizeBreakup" DROP CONSTRAINT "PISizeBreakup_ProformaInvoiceItemId_fkey";

-- AlterTable
ALTER TABLE "PISizeBreakup" DROP COLUMN "ProformaInvoiceItemId";
