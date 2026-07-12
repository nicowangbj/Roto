import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const inviteCode = typeof body.inviteCode === "string" ? body.inviteCode.trim().toUpperCase() : "";
  if (!inviteCode) return NextResponse.json({ error: "Invite code is required" }, { status: 400 });

  const teacherClass = await prisma.teacherClass.findUnique({ where: { inviteCode } });
  if (!teacherClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  const enrollment = await prisma.classEnrollment.upsert({
    where: {
      classId_studentId: {
        classId: teacherClass.id,
        studentId: user.id,
      },
    },
    update: {},
    create: {
      classId: teacherClass.id,
      studentId: user.id,
    },
    include: { class: true },
  });

  return NextResponse.json(enrollment);
}
