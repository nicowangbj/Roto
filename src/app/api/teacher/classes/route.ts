import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function createInviteCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classes = await prisma.teacherClass.findMany({
    where: { teacherId: user.id },
    include: {
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
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const mode = body.mode === "approval_required" ? "approval_required" : "observe";

  if (!name) return NextResponse.json({ error: "Class name is required" }, { status: 400 });

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
        teacherId: user.id,
      },
      include: { enrollments: true },
    });
  });

  return NextResponse.json(created, { status: 201 });
}
