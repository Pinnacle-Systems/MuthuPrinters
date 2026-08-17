-- AlterTable
ALTER TABLE "PrintingDetails" ADD COLUMN     "isFront" BOOLEAN DEFAULT false,
ADD COLUMN     "isFrontAndBack" BOOLEAN DEFAULT false;
