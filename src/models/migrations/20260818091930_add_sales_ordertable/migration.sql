-- CreateTable
CREATE TABLE "SalesOrder" (
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
    "orderType" TEXT,
    "orderQty" INTEGER,
    "remarks" TEXT,
    "termsAndCondition" TEXT,
    "termsId" INTEGER,
    "refNo" TEXT,
    "validDays" INTEGER,
    "validTo" TIMESTAMP(3),
    "taxTemplateId" INTEGER,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "conversionType" TEXT,
    "payTermId" INTEGER,
    "loadingId" INTEGER,
    "deliveryId" INTEGER,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItems" (
    "id" SERIAL NOT NULL,
    "saleOrderId" INTEGER,
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

    CONSTRAINT "SalesOrderItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOrderSizeBreakup" (
    "id" SERIAL NOT NULL,
    "saleOrderId" INTEGER NOT NULL,
    "sizeId" INTEGER,
    "qty" INTEGER,

    CONSTRAINT "SaleOrderSizeBreakup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SalesOrderToattachments" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SalesOrderToattachments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SalesOrderToattachments_B_index" ON "_SalesOrderToattachments"("B");

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_termsId_fkey" FOREIGN KEY ("termsId") REFERENCES "TermsAndConditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_taxTemplateId_fkey" FOREIGN KEY ("taxTemplateId") REFERENCES "TaxTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_payTermId_fkey" FOREIGN KEY ("payTermId") REFERENCES "PayTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_loadingId_fkey" FOREIGN KEY ("loadingId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItems" ADD CONSTRAINT "SalesOrderItems_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItems" ADD CONSTRAINT "SalesOrderItems_styleItemId_fkey" FOREIGN KEY ("styleItemId") REFERENCES "StyleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItems" ADD CONSTRAINT "SalesOrderItems_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItems" ADD CONSTRAINT "SalesOrderItems_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "Uom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItems" ADD CONSTRAINT "SalesOrderItems_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "Gsm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItems" ADD CONSTRAINT "SalesOrderItems_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItems" ADD CONSTRAINT "SalesOrderItems_hsnId_fkey" FOREIGN KEY ("hsnId") REFERENCES "Hsn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItems" ADD CONSTRAINT "SalesOrderItems_itemSubGroupId_fkey" FOREIGN KEY ("itemSubGroupId") REFERENCES "ItemSubGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderSizeBreakup" ADD CONSTRAINT "SaleOrderSizeBreakup_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SalesOrderItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderSizeBreakup" ADD CONSTRAINT "SaleOrderSizeBreakup_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalesOrderToattachments" ADD CONSTRAINT "_SalesOrderToattachments_A_fkey" FOREIGN KEY ("A") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalesOrderToattachments" ADD CONSTRAINT "_SalesOrderToattachments_B_fkey" FOREIGN KEY ("B") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
