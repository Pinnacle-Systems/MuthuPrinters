import { PrismaClient } from "#prisma-client";
const prisma = new PrismaClient();

let poInwardReturnItemsCount = await prisma.poInwardReturnItems.count({
    where: {
        poItemsId: 75
    }
})
console.log(poInwardReturnItemsCount)