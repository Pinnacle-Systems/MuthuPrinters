import { prisma } from "../lib/prisma.js";

import { seedBranches } from "./seeds/branches.js";
import { seedCities } from "./seeds/cities.js";
import { seedCompanies } from "./seeds/companies.js";
import { seedColors } from "./seeds/colors.js";
import { seedCountries } from "./seeds/countries.js";
import { seedDepartments } from "./seeds/departments.js";
import { seedEmployees } from "./seeds/employees.js";
import { seedEmployeeCategories } from "./seeds/employeeCategories.js";
import { seedFinYears } from "./seeds/finYears.js";
import { seedGsms } from "./seeds/gsms.js";
import { seedHsns } from "./seeds/hsns.js";
import { seedItemGroups } from "./seeds/itemGroups.js";
import { seedPages } from "./seeds/pages.js";
import { seedPayTerms } from "./seeds/payTerms.js";
import { seedParties } from "./seeds/parties.js";
import { seedRoleOnPages } from "./seeds/roleOnPages.js";
import { seedRoles } from "./seeds/roles.js";
import { seedSizes } from "./seeds/sizes.js";
import { seedSizeTemplates } from "./seeds/sizeTemplates.js";
import { seedStates } from "./seeds/states.js";
import { seedStyleItems } from "./seeds/styleItems.js";
import { seedTaxTemplateDetails } from "./seeds/taxTemplateDetails.js";
import { seedTaxTemplates } from "./seeds/taxTemplates.js";
import { seedTaxTerms } from "./seeds/taxTerms.js";
import { seedUoms } from "./seeds/uoms.js";
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
  await seedPayTerms();
  await seedRoles();
  await seedRoleOnPages();
  await seedTaxTerms();
  await seedTaxTemplates();
  await seedTaxTemplateDetails();
  await seedEmployees();
  await seedUsers();
  await seedUserOnBranches();
  await seedParties();
  await seedUoms();
  await seedHsns();
  await seedGsms();
  await seedColors();
  await seedSizes();
  await seedSizeTemplates();
  await seedItemGroups();
  await seedStyleItems();
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
