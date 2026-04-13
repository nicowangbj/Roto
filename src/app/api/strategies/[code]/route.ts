import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const strategy = await prisma.aIStrategy.findUnique({
    where: { code },
  });
  if (!strategy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(strategy);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json();
  const strategy = await prisma.aIStrategy.update({
    where: { code },
    data: {
      promptTemplate: body.promptTemplate,
      isConfigured: body.promptTemplate?.trim().length > 0,
      description: body.description,
      triggerTiming: body.triggerTiming,
    },
  });
  return NextResponse.json(strategy);
}
