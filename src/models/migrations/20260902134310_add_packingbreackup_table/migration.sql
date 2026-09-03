-- CreateTable
CREATE TABLE "PackingBreakup" (
    "id" SERIAL NOT NULL,
    "packingUomId" INTEGER,
    "quantity" TEXT,

    CONSTRAINT "PackingBreakup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PackingBreakup" ADD CONSTRAINT "PackingBreakup_packingUomId_fkey" FOREIGN KEY ("packingUomId") REFERENCES "Uom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
