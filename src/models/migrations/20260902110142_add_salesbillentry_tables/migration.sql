-- CreateTable
CREATE TABLE "SalesBillEntry" (
    "id" SERIAL NOT NULL,
    "docId" TEXT NOT NULL,
    "docDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "branchId" INTEGER,
    "customerId" INTEGER,
    "orderId" INTEGER,
    "salesDeliveryId" INTEGER,
    "orderType" TEXT,
    "orderQty" INTEGER,
    "remarks" TEXT,
    "termsAndCondition" TEXT,
    "refNo" TEXT,
    "validDays" INTEGER,
    "validTo" TIMESTAMP(3),
    "taxTemplateId" INTEGER,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "conversionType" TEXT,
    "payTermId" INTEGER,
    "deliveryCharge" INTEGER,
    "isDeliveryTaxInclusive" BOOLEAN DEFAULT false,
    "deliveryTaxType" TEXT,
    "deliveryTaxValue" DOUBLE PRECISION,

    CONSTRAINT "SalesBillEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesBillEntryItems" (
    "id" SERIAL NOT NULL,
    "salesBillEntryId" INTEGER,
    "styleItemId" INTEGER,
    "orderQty" INTEGER,
    "sizeId" INTEGER,
    "uomId" INTEGER,
    "gsmId" INTEGER,
    "itemGroupId" INTEGER,
    "hsnId" INTEGER,
    "trackingType" TEXT,
    "itemSubGroupId" INTEGER,
    "labelWidth" TEXT,
    "price" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "dozen" DOUBLE PRECISION,
    "taxPercent" DOUBLE PRECISION,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,

    CONSTRAINT "SalesBillEntryItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleBillEntryStyleBreakup" (
    "id" SERIAL NOT NULL,
    "salesBillEntryItemsId" INTEGER NOT NULL,
    "styleId" INTEGER,

    CONSTRAINT "SaleBillEntryStyleBreakup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleBillEntrySizeBreakup" (
    "id" SERIAL NOT NULL,
    "saleBillEntryStyleBreakupId" INTEGER NOT NULL,
    "sizeId" INTEGER,
    "qty" INTEGER,

    CONSTRAINT "SaleBillEntrySizeBreakup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_salesDeliveryId_fkey" FOREIGN KEY ("salesDeliveryId") REFERENCES "SalesDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_taxTemplateId_fkey" FOREIGN KEY ("taxTemplateId") REFERENCES "TaxTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntry" ADD CONSTRAINT "SalesBillEntry_payTermId_fkey" FOREIGN KEY ("payTermId") REFERENCES "PayTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntryItems" ADD CONSTRAINT "SalesBillEntryItems_salesBillEntryId_fkey" FOREIGN KEY ("salesBillEntryId") REFERENCES "SalesBillEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntryItems" ADD CONSTRAINT "SalesBillEntryItems_styleItemId_fkey" FOREIGN KEY ("styleItemId") REFERENCES "StyleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntryItems" ADD CONSTRAINT "SalesBillEntryItems_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntryItems" ADD CONSTRAINT "SalesBillEntryItems_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "Uom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntryItems" ADD CONSTRAINT "SalesBillEntryItems_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "Gsm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntryItems" ADD CONSTRAINT "SalesBillEntryItems_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntryItems" ADD CONSTRAINT "SalesBillEntryItems_hsnId_fkey" FOREIGN KEY ("hsnId") REFERENCES "Hsn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillEntryItems" ADD CONSTRAINT "SalesBillEntryItems_itemSubGroupId_fkey" FOREIGN KEY ("itemSubGroupId") REFERENCES "ItemSubGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleBillEntryStyleBreakup" ADD CONSTRAINT "SaleBillEntryStyleBreakup_salesBillEntryItemsId_fkey" FOREIGN KEY ("salesBillEntryItemsId") REFERENCES "SalesBillEntryItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleBillEntryStyleBreakup" ADD CONSTRAINT "SaleBillEntryStyleBreakup_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleBillEntrySizeBreakup" ADD CONSTRAINT "SaleBillEntrySizeBreakup_saleBillEntryStyleBreakupId_fkey" FOREIGN KEY ("saleBillEntryStyleBreakupId") REFERENCES "SaleBillEntryStyleBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleBillEntrySizeBreakup" ADD CONSTRAINT "SaleBillEntrySizeBreakup_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;
