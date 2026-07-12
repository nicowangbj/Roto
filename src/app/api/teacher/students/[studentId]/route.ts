import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const teacher = await getSessionUser();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await params;
  const classId = req.nextUrl.searchParams.get("classId");

  const enrollment = await prisma.classEnrollment.findFirst({
    where: {
      studentId,
      class: {
        teacherId: teacher.id,
        ...(classId ? { id: classId } : {}),
      },
    },
    include: { class: true },
  });

  if (!enrollment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      projects: {
        include: {
          topic: true,
          journalEntries: { orderBy: { createdAt: "desc" }, take: 20 },
          conversations: {
            include: { messages: { orderBy: { createdAt: "asc" }, take: 80 } },
            orderBy: { updatedAt: "desc" },
            take: 8,
          },
          phases: {
            include: {
              reviews: { where: { classId: enrollment.classId }, orderBy: { updatedAt: "desc" } },
              tasks: {
                include: { submissions: { orderBy: { createdAt: "desc" } } },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  return NextResponse.json({ class: enrollment.class, student });
}
