import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/models/schema.postgresql.prisma",
  migrations: {
    path: "src/models/migrations-postgresql",
    seed: "node src/models/seed.js",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
