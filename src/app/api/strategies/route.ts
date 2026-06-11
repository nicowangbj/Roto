import { prisma } from "@/lib/prisma";
import { getAdminUser, isAdminEnabled } from "@/lib/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!isAdminEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const strategies = await prisma.aIStrategy.findMany({
    orderBy: { code: "asc" },
  });
  return NextResponse.json(strategies, {
    headers: { "Cache-Control": "no-store" },
  });
}
