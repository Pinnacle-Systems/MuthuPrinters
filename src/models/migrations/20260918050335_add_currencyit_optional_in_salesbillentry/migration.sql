-- DropForeignKey
ALTER TABLE "SalesBillEntry" DROP CONSTRAINT "SalesBillEntry_currencyId_fkey";

-- AlterTable
ALTER TABLE "SalesBillEntry" ALTER COLUMN "currencyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
