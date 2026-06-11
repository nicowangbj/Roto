import { getSessionUser } from "@/lib/session-user";

function isTruthy(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes";
}

export function isAdminEnabled(): boolean {
  return isTruthy(process.env.ENABLE_ADMIN);
}

export function isAdminOnlyDeployment(): boolean {
  return isTruthy(process.env.ADMIN_ONLY);
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!isAdminEnabled()) return false;

  const allowlist = getAdminEmails();
  if (allowlist.length === 0) return false;

  return !!email && allowlist.includes(email.trim().toLowerCase());
}

export async function getAdminUser() {
  const user = await getSessionUser();
  if (!isAdminEmail(user?.email)) return null;
  return user;
}
