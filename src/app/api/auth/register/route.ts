import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import {
  authErrorMessage,
  classifyAuthError,
  normalizeEmail,
} from "@/lib/auth-diagnostics";
import { isAdminOnlyDeployment } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const locale = req.headers.get("x-locale") ?? "en";
  const zh = locale === "zh";

  try {
    if (isAdminOnlyDeployment()) {
      return NextResponse.json(
        { error: zh ? "管理后台不开放注册" : "Registration is disabled for admin deployments" },
        { status: 403 }
      );
    }

    const { name, email, password } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return NextResponse.json(
        { error: zh ? "请填写所有字段" : "Please fill in all fields" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: zh ? "密码至少需要 6 个字符" : "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const { prisma } = await import("@/lib/prisma");
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: zh ? "该邮箱已被注册" : "This email is already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email: normalizedEmail, password: hashedPassword },
      select: { id: true, name: true, email: true },
    });

    const { token, expiresAt } = await createSessionToken(user.id);
    const response = NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    );
    setSessionCookie(response, token, expiresAt);

    return response;
  } catch (err) {
    const code = classifyAuthError(err);
    console.error("Register error:", code, err);
    return NextResponse.json(
      { error: authErrorMessage(code, zh), code },
      { status: 500 }
    );
  }
}
