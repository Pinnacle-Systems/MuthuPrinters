-- AlterTable
ALTER TABLE "PISizeBreakup" ADD COLUMN     "PIStyleBreakupId" INTEGER;

-- CreateTable
CREATE TABLE "PIStyleBreakup" (
    "id" SERIAL NOT NULL,
    "ProformaInvoiceItemId" INTEGER NOT NULL,
    "styleId" INTEGER,

    CONSTRAINT "PIStyleBreakup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Packing" (
    "id" SERIAL NOT NULL,
    "docId" TEXT NOT NULL,
    "docDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "branchId" INTEGER,
    "orderId" INTEGER,
    "orderType" TEXT,
    "orderQty" INTEGER,
    "remarks" TEXT,
    "refNo" TEXT,
    "validDays" INTEGER,
    "validTo" TIMESTAMP(3),
    "productionQty" TEXT,
    "completedQty" TEXT,
    "pendingQty" TEXT,
    "alreadyPackedQty" TEXT,

    CONSTRAINT "Packing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingItems" (
    "id" SERIAL NOT NULL,
    "packingId" INTEGER,
    "styleItemId" INTEGER,
    "orderQty" INTEGER,
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

    CONSTRAINT "PackingItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingStyleBreakup" (
    "id" SERIAL NOT NULL,
    "PackingItemsId" INTEGER NOT NULL,
    "styleId" INTEGER,

    CONSTRAINT "PackingStyleBreakup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingSizeBreakup" (
    "id" SERIAL NOT NULL,
    "PackingStyleBreakupId" INTEGER NOT NULL,
    "sizeId" INTEGER,
    "qty" INTEGER,

    CONSTRAINT "PackingSizeBreakup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PIStyleBreakup" ADD CONSTRAINT "PIStyleBreakup_ProformaInvoiceItemId_fkey" FOREIGN KEY ("ProformaInvoiceItemId") REFERENCES "ProformaInvoiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PIStyleBreakup" ADD CONSTRAINT "PIStyleBreakup_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PISizeBreakup" ADD CONSTRAINT "PISizeBreakup_PIStyleBreakupId_fkey" FOREIGN KEY ("PIStyleBreakupId") REFERENCES "PIStyleBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingItems" ADD CONSTRAINT "PackingItems_packingId_fkey" FOREIGN KEY ("packingId") REFERENCES "Packing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingItems" ADD CONSTRAINT "PackingItems_styleItemId_fkey" FOREIGN KEY ("styleItemId") REFERENCES "StyleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingItems" ADD CONSTRAINT "PackingItems_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "Uom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingItems" ADD CONSTRAINT "PackingItems_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "Gsm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingItems" ADD CONSTRAINT "PackingItems_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingItems" ADD CONSTRAINT "PackingItems_hsnId_fkey" FOREIGN KEY ("hsnId") REFERENCES "Hsn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingItems" ADD CONSTRAINT "PackingItems_itemSubGroupId_fkey" FOREIGN KEY ("itemSubGroupId") REFERENCES "ItemSubGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingStyleBreakup" ADD CONSTRAINT "PackingStyleBreakup_PackingItemsId_fkey" FOREIGN KEY ("PackingItemsId") REFERENCES "PackingItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingStyleBreakup" ADD CONSTRAINT "PackingStyleBreakup_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSizeBreakup" ADD CONSTRAINT "PackingSizeBreakup_PackingStyleBreakupId_fkey" FOREIGN KEY ("PackingStyleBreakupId") REFERENCES "PackingStyleBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSizeBreakup" ADD CONSTRAINT "PackingSizeBreakup_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;
