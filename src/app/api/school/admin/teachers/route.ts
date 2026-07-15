import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { userCanManageSchool } from "@/lib/school";
import { appVariant } from "@/lib/app-variant";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (appVariant !== "school") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = await getSessionUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const schoolId = typeof body.schoolId === "string" ? body.schoolId : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role = body.role === "school_admin" ? "school_admin" : "teacher";

  if (!schoolId || !email) {
    return NextResponse.json({ error: "schoolId and email are required" }, { status: 400 });
  }
  if (!(await userCanManageSchool(admin.id, schoolId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: { role: role === "school_admin" ? "school_admin" : "teacher" },
      create: {
        email,
        name: name || email.split("@")[0],
        role: role === "school_admin" ? "school_admin" : "teacher",
      },
    });

    const membership = await tx.schoolMembership.upsert({
      where: { schoolId_userId: { schoolId, userId: user.id } },
      update: { role },
      create: { schoolId, userId: user.id, role },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    return membership;
  });

  return NextResponse.json(result, { status: 201 });
}
