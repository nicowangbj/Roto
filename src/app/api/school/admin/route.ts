import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { ensureSchoolWorkspace, userCanManageSchool } from "@/lib/school";
import { appVariant } from "@/lib/app-variant";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  if (appVariant !== "school") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await getSessionUser({ includeRole: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.schoolMembership.findMany({
    where: { userId: user.id },
    include: {
      school: {
        include: {
          memberships: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          classes: {
            include: {
              teacher: { select: { id: true, name: true, email: true } },
              enrollments: {
                include: {
                  student: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      projects: { select: { id: true, status: true } },
                    },
                  },
                },
              },
            },
            orderBy: { updatedAt: "desc" },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const adminMemberships = memberships.filter((item) => item.role === "school_admin");
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    memberships,
    adminSchools: adminMemberships.map((item) => item.school),
  });
}

export async function POST(req: NextRequest) {
  if (appVariant !== "school") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await getSessionUser({ includeRole: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!name) {
    const workspace = await ensureSchoolWorkspace(user);
    return NextResponse.json(workspace.school, { status: 201 });
  }

  const school = await prisma.$transaction(async (tx) => {
    const created = await tx.school.create({
      data: {
        name,
        description: description || null,
        ownerId: user.id,
      },
    });
    await tx.schoolMembership.upsert({
      where: { schoolId_userId: { schoolId: created.id, userId: user.id } },
      update: { role: "school_admin" },
      create: { schoolId: created.id, userId: user.id, role: "school_admin" },
    });
    await tx.user.update({ where: { id: user.id }, data: { role: "school_admin" } });
    return created;
  });

  return NextResponse.json(school, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (appVariant !== "school") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await getSessionUser({ includeRole: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const schoolId = typeof body.schoolId === "string" ? body.schoolId : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!schoolId || !name) {
    return NextResponse.json({ error: "schoolId and name are required" }, { status: 400 });
  }
  if (!(await userCanManageSchool(user.id, schoolId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.school.update({
    where: { id: schoolId },
    data: { name, description: description || null },
  });
  return NextResponse.json(updated);
}
