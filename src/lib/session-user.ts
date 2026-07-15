import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role?: string;
};

export async function getSessionUser(options?: {
  includeRole?: boolean;
}): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;

  if (options?.includeRole) {
    return prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, avatar: true, role: true },
    });
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, avatar: true },
  });
}
