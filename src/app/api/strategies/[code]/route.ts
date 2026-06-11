import { prisma } from "@/lib/prisma";
import { getAdminUser, isAdminEnabled } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireAdmin() {
  if (!isAdminEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { code } = await params;
  const strategy = await prisma.aIStrategy.findUnique({
    where: { code },
  });
  if (!strategy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(strategy, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { code } = await params;
  const body = await req.json();
  const promptTemplate =
    typeof body.promptTemplate === "string" ? body.promptTemplate : "";
  const strategy = await prisma.aIStrategy.update({
    where: { code },
    data: {
      promptTemplate,
      isConfigured: promptTemplate.trim().length > 0,
      description:
        typeof body.description === "string" ? body.description : null,
      triggerTiming:
        typeof body.triggerTiming === "string" ? body.triggerTiming : null,
    },
  });
  return NextResponse.json(strategy, {
    headers: { "Cache-Control": "no-store" },
  });
}
