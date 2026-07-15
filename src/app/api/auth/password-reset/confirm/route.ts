import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import {
  isStrongPassword,
  verifyPasswordResetToken,
} from "@/lib/password-reset";
import {
  authErrorMessage,
  classifyAuthError,
  normalizeEmail,
} from "@/lib/auth-diagnostics";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const locale = req.headers.get("x-locale") ?? "en";
  const zh = locale === "zh";

  try {
    const { token, password } = await req.json();
    const email = typeof token === "string" ? await verifyPasswordResetToken(token) : null;

    if (!email) {
      return NextResponse.json(
        { error: zh ? "重置链接无效或已过期" : "This reset link is invalid or expired" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || !isStrongPassword(password)) {
      return NextResponse.json(
        {
          error: zh
            ? "密码至少需要 8 位，并包含字母和数字"
            : "Password must be at least 8 characters and include letters and numbers",
        },
        { status: 400 }
      );
    }

    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.update({
      where: { email: normalizeEmail(email) },
      data: { password: await hashPassword(password) },
      select: { id: true, name: true, email: true },
    });

    const { token: sessionToken, expiresAt } = await createSessionToken(user.id);
    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    setSessionCookie(response, sessionToken, expiresAt);
    return response;
  } catch (err) {
    const code = classifyAuthError(err);
    console.error("Password reset confirm error:", code, err);
    return NextResponse.json(
      { error: authErrorMessage(code, zh), code },
      { status: 500 }
    );
  }
}
