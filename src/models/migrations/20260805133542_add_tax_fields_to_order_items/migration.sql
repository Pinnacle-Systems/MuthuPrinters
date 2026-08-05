-- AlterTable
ALTER TABLE "OrderItems" ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION,
ADD COLUMN     "taxPercent" DOUBLE PRECISION;
