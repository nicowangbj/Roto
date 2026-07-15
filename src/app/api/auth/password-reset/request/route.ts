import { createPasswordResetToken } from "@/lib/password-reset";
import {
  createResetUrl,
  isPasswordResetEmailConfigured,
  sendPasswordResetEmail,
} from "@/lib/reset-email";
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
    const { email } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: zh ? "请输入邮箱地址" : "Please enter your email address" },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "production" && !isPasswordResetEmailConfigured()) {
      return NextResponse.json(
        {
          error: zh
            ? "密码重置邮件服务尚未配置，请联系管理员"
            : "Password reset email is not configured yet. Please contact support.",
          code: "EMAIL_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    let resetUrl: string | undefined;
    let emailConfigured = false;

    if (user) {
      const token = await createPasswordResetToken(user.email);
      resetUrl = createResetUrl(req, locale, token);
      const result = await sendPasswordResetEmail(user.email, resetUrl);
      emailConfigured = result.sent;
    }

    return NextResponse.json({
      ok: true,
      emailConfigured,
      resetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
      message: zh
        ? "如果该邮箱存在，我们会发送密码重置链接。"
        : "If that email exists, we will send a password reset link.",
    });
  } catch (err) {
    const code = classifyAuthError(err);
    console.error("Password reset request error:", code, err);
    return NextResponse.json(
      { error: authErrorMessage(code, zh), code },
      { status: 500 }
    );
  }
}
