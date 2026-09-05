-- AlterTable
ALTER TABLE "Ledger" ADD COLUMN     "currencyId" INTEGER,
ADD COLUMN     "salesBillEntryId" INTEGER;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_salesBillEntryId_fkey" FOREIGN KEY ("salesBillEntryId") REFERENCES "SalesBillEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
