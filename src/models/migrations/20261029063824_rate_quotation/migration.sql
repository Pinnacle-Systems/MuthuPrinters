-- CreateTable
CREATE TABLE "RateQuotation" (
    "id" SERIAL NOT NULL,
    "docId" TEXT NOT NULL,
    "docDate" TIMESTAMP(3),
    "userDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "branchId" INTEGER,
    "companyId" INTEGER,
    "finYearId" INTEGER,
    "customerId" INTEGER,

    CONSTRAINT "RateQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateQuotationItems" (
    "id" SERIAL NOT NULL,
    "rateQuotationId" INTEGER NOT NULL,
    "itemGroupId" INTEGER,
    "itemSubGroupId" INTEGER,
    "styleItemId" INTEGER,
    "hsnId" INTEGER,
    "price" DOUBLE PRECISION,
    "taxPercent" DOUBLE PRECISION,

    CONSTRAINT "RateQuotationItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RateQuotation_docId_key" ON "RateQuotation"("docId");

-- AddForeignKey
ALTER TABLE "RateQuotation" ADD CONSTRAINT "RateQuotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateQuotation" ADD CONSTRAINT "RateQuotation_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateQuotation" ADD CONSTRAINT "RateQuotation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateQuotation" ADD CONSTRAINT "RateQuotation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateQuotation" ADD CONSTRAINT "RateQuotation_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateQuotation" ADD CONSTRAINT "RateQuotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateQuotationItems" ADD CONSTRAINT "RateQuotationItems_rateQuotationId_fkey" FOREIGN KEY ("rateQuotationId") REFERENCES "RateQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateQuotationItems" ADD CONSTRAINT "RateQuotationItems_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateQuotationItems" ADD CONSTRAINT "RateQuotationItems_itemSubGroupId_fkey" FOREIGN KEY ("itemSubGroupId") REFERENCES "ItemSubGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateQuotationItems" ADD CONSTRAINT "RateQuotationItems_styleItemId_fkey" FOREIGN KEY ("styleItemId") REFERENCES "StyleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateQuotationItems" ADD CONSTRAINT "RateQuotationItems_hsnId_fkey" FOREIGN KEY ("hsnId") REFERENCES "Hsn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
