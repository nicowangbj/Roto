import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

const envLocal = path.resolve(process.cwd(), ".env.local");
try {
  const content = readFileSync(envLocal, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  }
} catch {}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL not set");
  process.exit(1);
}

const client = createClient({ url, authToken });

const migrationsDir = path.resolve(process.cwd(), "prisma/migrations");
const dirs = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("."))
  .map((d) => d.name)
  .sort();

async function main() {
  console.log(`Found ${dirs.length} migrations:`, dirs);

  // Disable foreign keys during migration to avoid ordering issues
  await client.execute("PRAGMA foreign_keys = OFF");

  for (const dir of dirs) {
    const sqlPath = path.join(migrationsDir, dir, "migration.sql");
    const sql = readFileSync(sqlPath, "utf-8");
    console.log(`\n→ Applying ${dir}...`);

    const statements = sql
      .split(";")
      .map((s) =>
        s
          .split("\n")
          .filter((line) => !line.trim().startsWith("--"))
          .join("\n")
          .trim()
      )
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (msg.includes("already exists") || msg.includes("duplicate column")) {
          console.log(`  skip (exists): ${stmt.slice(0, 60)}...`);
        } else {
          console.error(`  FAILED: ${stmt.slice(0, 120)}`);
          console.error(`  Error: ${msg}`);
          throw err;
        }
      }
    }
    console.log(`  ✓ ${dir} done`);
  }

  console.log("\n✅ All migrations applied to Turso");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
