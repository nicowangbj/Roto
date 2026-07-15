import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV !== "production") {
    return "roto-local-development-session-secret";
  }

  throw new Error(
    "Session secret is not configured. Set SESSION_SECRET, AUTH_SECRET, or NEXTAUTH_SECRET."
  );
}

function getEncodedKey() {
  return new TextEncoder().encode(getSessionSecret());
}

// ─── Password ───

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ───

interface SessionPayload {
  userId: string;
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

export async function decrypt(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

// ─── Session Cookie ───

export async function createSessionToken(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({ userId, expiresAt });
  return { token, expiresAt };
}

export function setSessionCookie(
  response: import("next/server").NextResponse,
  token: string,
  expiresAt: Date
) {
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return decrypt(session);
}

export function clearSessionCookie(
  response: import("next/server").NextResponse
) {
  response.cookies.delete("session");
}
