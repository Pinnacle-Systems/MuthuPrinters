-- CreateTable
CREATE TABLE "SalesDeliveryPacking" (
    "id" SERIAL NOT NULL,
    "salesSizeBreakupId" INTEGER NOT NULL,
    "qty" INTEGER,
    "bundle" INTEGER,

    CONSTRAINT "SalesDeliveryPacking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderPacking" (
    "id" SERIAL NOT NULL,
    "saleOrderSizeBreakupId" INTEGER NOT NULL,
    "qty" INTEGER,
    "bundle" INTEGER,

    CONSTRAINT "SalesOrderPacking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SalesDeliveryPacking" ADD CONSTRAINT "SalesDeliveryPacking_salesSizeBreakupId_fkey" FOREIGN KEY ("salesSizeBreakupId") REFERENCES "SalesSizeBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderPacking" ADD CONSTRAINT "SalesOrderPacking_saleOrderSizeBreakupId_fkey" FOREIGN KEY ("saleOrderSizeBreakupId") REFERENCES "SaleOrderSizeBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
