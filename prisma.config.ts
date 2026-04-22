import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const localDbPath = `file:${path.resolve(__dirname, "prisma/dev.db")}`;

const adapter = tursoUrl
  ? new PrismaLibSql({ url: tursoUrl, authToken: tursoToken })
  : new PrismaBetterSqlite3({
      url: path.resolve(__dirname, "prisma/dev.db"),
    });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: localDbPath,
  },
  adapter: () => Promise.resolve(adapter),
});
