import { NextResponse } from "next/server";
import {
  classifyAuthError,
  sanitizeErrorMessage,
} from "@/lib/auth-diagnostics";
import { appVariant } from "@/lib/app-variant";

function describeDatabaseUrl() {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) return "missing";
  if (url.startsWith("libsql://")) return "libsql";
  if (url.startsWith("file:")) return "file";
  return "custom";
}

export async function GET() {
  const base = {
    appVariant,
    databaseUrl: describeDatabaseUrl(),
    hasDatabaseToken: Boolean(
      process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
    ),
    hasSessionSecret: Boolean(
      process.env.SESSION_SECRET ||
        process.env.AUTH_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        process.env.NODE_ENV !== "production"
    ),
    isVercel: process.env.VERCEL === "1",
    nodeEnv: process.env.NODE_ENV,
  };

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.user.findFirst({
      select: { id: true, email: true, password: true },
    });

    return NextResponse.json({
      ok: true,
      ...base,
      userTableReadable: true,
      userPasswordColumnReadable: true,
    });
  } catch (error) {
    const code = classifyAuthError(error);

    return NextResponse.json(
      {
        ok: false,
        ...base,
        code,
        message: sanitizeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
