import "dotenv/config";
import { PrismaClient } from "#prisma-client";

const globalForPrisma = globalThis;

const prisma = globalForPrisma.__muthuPrintersPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__muthuPrintersPrisma = prisma;
}

export { prisma };
