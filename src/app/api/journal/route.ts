import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  if (!projectId) {
    const project = await prisma.project.findFirst({ where: { userId: user.id } });
    if (!project) return NextResponse.json([]);

    const entries = await prisma.journalEntry.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(entries);
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await prisma.journalEntry.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(entries);
}
