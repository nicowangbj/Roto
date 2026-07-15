export type AuthErrorCode =
  | "AUTH_CONFIG_MISSING"
  | "DATABASE_CONFIG_MISSING"
  | "DATABASE_TOKEN_MISSING"
  | "DATABASE_SCHEMA_MISSING"
  | "DATABASE_QUERY_FAILED"
  | "UNKNOWN_AUTH_ERROR";

export function normalizeEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function classifyAuthError(error: unknown): AuthErrorCode {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("session secret is not configured")) {
    return "AUTH_CONFIG_MISSING";
  }

  if (lower.includes("production database is not configured")) {
    return "DATABASE_CONFIG_MISSING";
  }

  if (lower.includes("turso database token is not configured")) {
    return "DATABASE_TOKEN_MISSING";
  }

  if (
    lower.includes("no such table") ||
    lower.includes("no such column") ||
    lower.includes("unknown column") ||
    lower.includes("schema")
  ) {
    return "DATABASE_SCHEMA_MISSING";
  }

  if (
    lower.includes("prisma") ||
    lower.includes("sqlite") ||
    lower.includes("libsql") ||
    lower.includes("database")
  ) {
    return "DATABASE_QUERY_FAILED";
  }

  return "UNKNOWN_AUTH_ERROR";
}

export function authErrorMessage(code: AuthErrorCode, zh: boolean): string {
  if (code === "AUTH_CONFIG_MISSING") {
    return zh
      ? "登录服务缺少会话配置，请联系管理员"
      : "Login service is missing session configuration";
  }

  if (code === "DATABASE_CONFIG_MISSING") {
    return zh
      ? "线上数据库地址未配置，请在 Vercel 中配置 TURSO_DATABASE_URL"
      : "Online database URL is missing. Configure TURSO_DATABASE_URL in Vercel";
  }

  if (code === "DATABASE_TOKEN_MISSING") {
    return zh
      ? "线上数据库 token 未配置，请在 Vercel 中配置 TURSO_AUTH_TOKEN"
      : "Online database token is missing. Configure TURSO_AUTH_TOKEN in Vercel";
  }

  if (code === "DATABASE_SCHEMA_MISSING") {
    return zh
      ? "线上数据库表结构未同步，请运行数据库迁移"
      : "Online database schema is out of sync. Run the database migration";
  }

  if (code === "DATABASE_QUERY_FAILED") {
    return zh
      ? "登录服务暂时无法连接用户数据库，请联系管理员"
      : "Login service cannot reach the user database right now";
  }

  return zh ? "登录失败，请稍后重试" : "Login failed, please try again";
}

export function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/https?:\/\/\S+/g, "[url]").slice(0, 220);
}
