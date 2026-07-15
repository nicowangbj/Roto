import { SignJWT, jwtVerify } from "jose";
import { getSessionSecret } from "@/lib/auth";

const resetPurpose = "password-reset";

function getEncodedKey() {
  return new TextEncoder().encode(getSessionSecret());
}

export async function createPasswordResetToken(email: string): Promise<string> {
  return new SignJWT({ email, purpose: resetPurpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(getEncodedKey());
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    if (payload.purpose !== resetPurpose || typeof payload.email !== "string") {
      return null;
    }
    return payload.email;
  } catch {
    return null;
  }
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}
