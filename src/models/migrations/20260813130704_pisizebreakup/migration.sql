-- AlterTable
ALTER TABLE "ProformaInvoiceItem" ADD COLUMN     "itemGroupId" INTEGER,
ADD COLUMN     "itemSubGroupId" INTEGER,
ADD COLUMN     "labelWidth" TEXT;

-- CreateTable
CREATE TABLE "PISizeBreakup" (
    "id" SERIAL NOT NULL,
    "ProformaInvoiceItemId" INTEGER NOT NULL,
    "sizeId" INTEGER,
    "qty" INTEGER,

    CONSTRAINT "PISizeBreakup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProformaInvoiceItem" ADD CONSTRAINT "ProformaInvoiceItem_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoiceItem" ADD CONSTRAINT "ProformaInvoiceItem_itemSubGroupId_fkey" FOREIGN KEY ("itemSubGroupId") REFERENCES "ItemSubGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PISizeBreakup" ADD CONSTRAINT "PISizeBreakup_ProformaInvoiceItemId_fkey" FOREIGN KEY ("ProformaInvoiceItemId") REFERENCES "ProformaInvoiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PISizeBreakup" ADD CONSTRAINT "PISizeBreakup_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;
