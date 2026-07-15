type ResetEmailResult = {
  sent: boolean;
  reason?: "EMAIL_NOT_CONFIGURED";
};

function getBaseUrl(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  const url = new URL(req.url);
  return url.origin;
}

export function createResetUrl(req: Request, locale: string, token: string): string {
  return `${getBaseUrl(req)}/${locale}/login?resetToken=${encodeURIComponent(token)}`;
}

export function isPasswordResetEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
      (process.env.PASSWORD_RESET_FROM || process.env.RESEND_FROM_EMAIL)
  );
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<ResetEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM || process.env.RESEND_FROM_EMAIL;

  if (!isPasswordResetEmailConfigured() || !apiKey || !from) {
    console.warn("Password reset email is not configured. Set RESEND_API_KEY and PASSWORD_RESET_FROM.");
    return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Reset your Roto password",
      html: [
        "<p>We received a request to reset your Roto password.</p>",
        `<p><a href="${resetUrl}">Reset your password</a></p>`,
        "<p>This link will expire in 30 minutes. If you did not request this, you can ignore this email.</p>",
      ].join(""),
      text: [
        "We received a request to reset your Roto password.",
        `Reset your password: ${resetUrl}`,
        "This link will expire in 30 minutes. If you did not request this, you can ignore this email.",
      ].join("\n\n"),
    }),
  });

  if (!response.ok) {
    throw new Error(`Password reset email failed: ${response.status}`);
  }

  return { sent: true };
}
