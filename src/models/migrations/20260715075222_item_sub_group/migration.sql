-- CreateTable
CREATE TABLE "ItemSubGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "itemGroupId" INTEGER NOT NULL,

    CONSTRAINT "ItemSubGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItemSubGroup" ADD CONSTRAINT "ItemSubGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemSubGroup" ADD CONSTRAINT "ItemSubGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemSubGroup" ADD CONSTRAINT "ItemSubGroup_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemSubGroup" ADD CONSTRAINT "ItemSubGroup_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
