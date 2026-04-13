import { prisma } from "../lib/prisma.js";

import { seedBranches } from "./seeds/branches.js";
import { seedCities } from "./seeds/cities.js";
import { seedCompanies } from "./seeds/companies.js";
import { seedCountries } from "./seeds/countries.js";
import { seedDepartments } from "./seeds/departments.js";
import { seedEmployees } from "./seeds/employees.js";
import { seedEmployeeCategories } from "./seeds/employeeCategories.js";
import { seedFinYears } from "./seeds/finYears.js";
import { seedPages } from "./seeds/pages.js";
import { seedRoleOnPages } from "./seeds/roleOnPages.js";
import { seedRoles } from "./seeds/roles.js";
import { seedStates } from "./seeds/states.js";
import { seedUserOnBranches } from "./seeds/userOnBranches.js";
import { seedUsers } from "./seeds/users.js";

async function main() {
  await seedPages();
  await seedCompanies();
  await seedCountries();
  await seedStates();
  await seedCities();
  await seedBranches();
  await seedDepartments();
  await seedEmployeeCategories();
  await seedFinYears();
  await seedRoles();
  await seedRoleOnPages();
  await seedEmployees();
  await seedUsers();
  await seedUserOnBranches();
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
