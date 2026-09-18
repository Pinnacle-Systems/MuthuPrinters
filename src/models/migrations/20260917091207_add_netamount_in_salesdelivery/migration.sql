-- AlterTable
ALTER TABLE "Ledger" ADD COLUMN     "paymentId" INTEGER;

-- AlterTable
ALTER TABLE "SalesDelivery" ADD COLUMN     "netAmount" TEXT;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
