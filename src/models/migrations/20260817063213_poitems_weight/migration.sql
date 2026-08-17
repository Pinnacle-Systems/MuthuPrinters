-- AlterTable
ALTER TABLE "PoItems" ADD COLUMN     "pricePerKg" INTEGER,
ADD COLUMN     "sheetsPerPacket" INTEGER,
ADD COLUMN     "totalPackets" INTEGER,
ADD COLUMN     "weightPerPacket" DOUBLE PRECISION;
