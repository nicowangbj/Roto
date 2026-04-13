import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const strategies = await prisma.aIStrategy.findMany({
    orderBy: { code: "asc" },
  });
  return NextResponse.json(strategies);
}
