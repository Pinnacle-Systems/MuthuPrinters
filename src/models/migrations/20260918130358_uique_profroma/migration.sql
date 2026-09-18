/*
  Warnings:

  - A unique constraint covering the columns `[docId]` on the table `ProformaInvoice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProformaInvoice_docId_key" ON "ProformaInvoice"("docId");
