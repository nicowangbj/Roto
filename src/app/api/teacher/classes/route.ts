import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { ensureSchoolWorkspace, userCanTeachInSchool } from "@/lib/school";
import { appVariant } from "@/lib/app-variant";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function createInviteCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function GET() {
  if (appVariant !== "school") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await ensureSchoolWorkspace(user);

  const classes = await prisma.teacherClass.findMany({
    where: membership.role === "school_admin"
      ? { schoolId: membership.schoolId }
      : { schoolId: membership.schoolId, teacherId: user.id },
    include: {
      school: true,
      teacher: { select: { id: true, name: true, email: true } },
      enrollments: {
        include: {
          student: {
            include: {
              projects: {
                include: {
                  topic: true,
                  phases: {
                    include: {
                      reviews: { where: { class: { teacherId: user.id } } },
                      tasks: { include: { submissions: true }, orderBy: { order: "asc" } },
                    },
                    orderBy: { order: "asc" },
                  },
                },
                orderBy: { updatedAt: "desc" },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  if (appVariant !== "school") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const mode = body.mode === "approval_required" ? "approval_required" : "observe";
  const requestedSchoolId = typeof body.schoolId === "string" ? body.schoolId : "";

  if (!name) return NextResponse.json({ error: "Class name is required" }, { status: 400 });

  const membership = requestedSchoolId
    ? await prisma.schoolMembership.findUnique({
        where: { schoolId_userId: { schoolId: requestedSchoolId, userId: user.id } },
        include: { school: true },
      })
    : await ensureSchoolWorkspace(user);

  if (!membership || !(await userCanTeachInSchool(user.id, membership.schoolId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let inviteCode = createInviteCode();
  for (let i = 0; i < 5; i += 1) {
    const existing = await prisma.teacherClass.findUnique({ where: { inviteCode } });
    if (!existing) break;
    inviteCode = createInviteCode();
  }

  const created = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { role: "teacher" } });
    return tx.teacherClass.create({
      data: {
        name,
        description: description || null,
        mode,
        inviteCode,
        schoolId: membership.schoolId,
        teacherId: user.id,
      },
      include: { school: true, teacher: { select: { id: true, name: true, email: true } }, enrollments: true },
    });
  });

  return NextResponse.json(created, { status: 201 });
}
