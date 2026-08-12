-- AlterTable
ALTER TABLE "OrderEntry" ADD COLUMN     "bankId" INTEGER,
ADD COLUMN     "carriageCharge" DOUBLE PRECISION,
ADD COLUMN     "conversionType" TEXT,
ADD COLUMN     "currencyId" INTEGER,
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION,
ADD COLUMN     "payTermId" INTEGER,
ADD COLUMN     "taxTemplateId" INTEGER,
ADD COLUMN     "weightInKg" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "OrderItems" ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "dozen" DOUBLE PRECISION,
ADD COLUMN     "price" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "OrderEntry" ADD CONSTRAINT "OrderEntry_taxTemplateId_fkey" FOREIGN KEY ("taxTemplateId") REFERENCES "TaxTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEntry" ADD CONSTRAINT "OrderEntry_payTermId_fkey" FOREIGN KEY ("payTermId") REFERENCES "PayTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEntry" ADD CONSTRAINT "OrderEntry_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEntry" ADD CONSTRAINT "OrderEntry_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
