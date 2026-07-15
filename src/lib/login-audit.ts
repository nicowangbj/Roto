import type { PrismaClient } from "@/generated/prisma/client";

export async function recordLastLogin(prisma: PrismaClient, userId: string) {
  try {
    await prisma.$executeRawUnsafe(
      'UPDATE "User" SET "lastLoginAt" = CURRENT_TIMESTAMP WHERE "id" = ?',
      userId
    );
  } catch {
    // Older personal-version databases do not have lastLoginAt yet.
  }
}
