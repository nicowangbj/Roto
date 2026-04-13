import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";

const dbPath = path.resolve(__dirname, "prisma/dev.db");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: `file:${dbPath}`,
  },
});
