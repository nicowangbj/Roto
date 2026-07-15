import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { recordLastLogin } from "@/lib/login-audit";
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
    const { email, password } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: zh ? "请填写邮箱和密码" : "Please enter your email and password" },
        { status: 400 }
      );
    }

    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, password: true },
    });
    if (!user || !user.password) {
      return NextResponse.json(
        { error: zh ? "邮箱或密码错误" : "Incorrect email or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: zh ? "邮箱或密码错误" : "Incorrect email or password" },
        { status: 401 }
      );
    }

    await recordLastLogin(prisma, user.id);

    const { token, expiresAt } = await createSessionToken(user.id);
    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    setSessionCookie(response, token, expiresAt);

    return response;
  } catch (err) {
    const code = classifyAuthError(err);
    console.error("Login error:", code, err);
    return NextResponse.json(
      { error: authErrorMessage(code, zh), code },
      { status: 500 }
    );
  }
}
