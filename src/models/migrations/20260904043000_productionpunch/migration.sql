-- CreateTable
CREATE TABLE "MobileNotification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "roleId" INTEGER,
    "createdAt" TIMESTAMP(3),
    "isViewed" BOOLEAN,

    CONSTRAINT "MobileNotification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MobileNotification" ADD CONSTRAINT "MobileNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileNotification" ADD CONSTRAINT "MobileNotification_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
