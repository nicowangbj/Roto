import { getSessionUser } from "@/lib/session-user";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await req.json();
  const avatar = typeof body.avatar === "string" ? body.avatar : "";
  if (!avatar.startsWith("data:image/") || avatar.length > 1_200_000) {
    return NextResponse.json({ error: "Invalid avatar" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatar },
    select: { id: true, name: true, email: true, avatar: true },
  });

  return NextResponse.json(updated);
}
