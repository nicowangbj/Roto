import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { appVariant } from "@/lib/app-variant";
import { NextRequest, NextResponse } from "next/server";

async function unlockNextPhase(phaseId: string) {
  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    include: {
      project: {
        include: {
          phases: { include: { tasks: true }, orderBy: { order: "asc" } },
        },
      },
    },
  });
  if (!phase) return;

  const nextPhase = phase.project.phases.find(
    (item) => item.order > phase.order && item.status === "locked"
  );
  if (!nextPhase) return;

  await prisma.phase.update({ where: { id: nextPhase.id }, data: { status: "active" } });

  const firstTask = nextPhase.tasks.sort((a, b) => a.order - b.order)[0];
  if (firstTask && firstTask.status === "locked") {
    await prisma.task.update({ where: { id: firstTask.id }, data: { status: "active" } });
  }
}

export async function POST(req: NextRequest) {
  if (appVariant !== "school") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const teacher = await getSessionUser();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const phaseId = typeof body.phaseId === "string" ? body.phaseId : "";
  const classId = typeof body.classId === "string" ? body.classId : "";
  const feedback = typeof body.feedback === "string" ? body.feedback.trim() : "";
  const status = body.status === "approved" ? "approved" : "revision_requested";

  if (!phaseId || !classId) {
    return NextResponse.json({ error: "phaseId and classId are required" }, { status: 400 });
  }

  const teacherClass = await prisma.teacherClass.findFirst({
    where: {
      id: classId,
      OR: [
        { teacherId: teacher.id },
        { school: { memberships: { some: { userId: teacher.id, role: "school_admin" } } } },
      ],
    },
  });
  if (!teacherClass) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    include: { project: true },
  });
  if (!phase) return NextResponse.json({ error: "Phase not found" }, { status: 404 });

  const enrollment = await prisma.classEnrollment.findUnique({
    where: {
      classId_studentId: {
        classId,
        studentId: phase.project.userId,
      },
    },
  });
  if (!enrollment) return NextResponse.json({ error: "Student is not in this class" }, { status: 403 });

  const review = await prisma.$transaction(async (tx) => {
    const saved = await tx.phaseReview.upsert({
      where: { phaseId_classId: { phaseId, classId } },
      update: { status, feedback: feedback || null, teacherId: teacher.id },
      create: { phaseId, classId, teacherId: teacher.id, status, feedback: feedback || null },
    });

    await tx.phase.update({
      where: { id: phaseId },
      data: { status: status === "approved" ? "completed" : "active" },
    });

    return saved;
  });

  if (status === "approved") await unlockNextPhase(phaseId);

  return NextResponse.json(review);
}
