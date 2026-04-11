import { prisma } from "../lib/prisma.js";

import { seedPages } from "./seeds/pages.js";
import { seedUsers } from "./seeds/users.js";

async function main() {
  await seedPages();
  await seedUsers();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
