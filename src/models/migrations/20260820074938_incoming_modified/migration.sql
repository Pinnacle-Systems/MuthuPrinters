-- AlterTable
ALTER TABLE "IncomingQty" ADD COLUMN     "completedQty" INTEGER,
ADD COLUMN     "pendingQty" INTEGER,
ADD COLUMN     "wastageQty" INTEGER;
