import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getDatabaseUrl() {
  return process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
}

function isLocalSqliteUrl(url: string | undefined) {
  return !url || url.startsWith("file:");
}

function resolveSqlitePath(url: string | undefined) {
  if (!url) return path.resolve(process.cwd(), "prisma/dev.db");

  const filePath = url.replace(/^file:/, "");
  if (path.isAbsolute(filePath)) return filePath;

  return path.resolve(process.cwd(), "prisma", filePath);
}

function createPrisma(): PrismaClient {
  const databaseUrl = getDatabaseUrl();
  const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

  if (!isLocalSqliteUrl(databaseUrl)) {
    const remoteDatabaseUrl = databaseUrl as string;

    if (remoteDatabaseUrl.startsWith("libsql://") && !tursoToken) {
      throw new Error(
        "Turso database token is not configured. Set TURSO_AUTH_TOKEN or DATABASE_AUTH_TOKEN."
      );
    }

    const adapter = new PrismaLibSql({
      url: remoteDatabaseUrl,
      authToken: tursoToken,
    });
    return new PrismaClient({ adapter });
  }

  if (process.env.VERCEL === "1" && process.env.NODE_ENV === "production") {
    throw new Error(
      "Production database is not configured. Set TURSO_DATABASE_URL or DATABASE_URL to a libSQL/Turso URL."
    );
  }

  const dbPath = resolveSqlitePath(databaseUrl);
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
