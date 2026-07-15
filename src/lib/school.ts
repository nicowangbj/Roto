import { prisma } from "@/lib/prisma";

export async function getPrimarySchoolMembership(userId: string) {
  return prisma.schoolMembership.findFirst({
    where: { userId },
    include: { school: true },
    orderBy: { createdAt: "asc" },
  });
}

async function attachLegacyTeacherClasses(userId: string, schoolId: string) {
  await prisma.teacherClass.updateMany({
    where: { teacherId: userId, schoolId: null },
    data: { schoolId },
  });
}

export async function ensureSchoolWorkspace(user: { id: string; name: string; role: string }) {
  const membership = await getPrimarySchoolMembership(user.id);
  if (membership) {
    await attachLegacyTeacherClasses(user.id, membership.schoolId);
    return membership;
  }

  return prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        name: `${user.name || "Roto"} School Workspace`,
        ownerId: user.id,
      },
    });

    const created = await tx.schoolMembership.create({
      data: {
        schoolId: school.id,
        userId: user.id,
        role: user.role === "teacher" ? "teacher" : "school_admin",
      },
      include: { school: true },
    });

    if (user.role === "student") {
      await tx.user.update({ where: { id: user.id }, data: { role: "school_admin" } });
    }

    await tx.teacherClass.updateMany({
      where: { teacherId: user.id, schoolId: null },
      data: { schoolId: school.id },
    });

    return created;
  });
}

export async function userCanManageSchool(userId: string, schoolId: string) {
  const membership = await prisma.schoolMembership.findUnique({
    where: { schoolId_userId: { schoolId, userId } },
  });
  return membership?.role === "school_admin";
}

export async function userCanTeachInSchool(userId: string, schoolId: string) {
  const membership = await prisma.schoolMembership.findUnique({
    where: { schoolId_userId: { schoolId, userId } },
  });
  return membership?.role === "school_admin" || membership?.role === "teacher";
}
