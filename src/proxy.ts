import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function isTruthy(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminEnabled = isTruthy(process.env.ENABLE_ADMIN);
  const adminOnly = isTruthy(process.env.ADMIN_ONLY);

  if (pathname.startsWith("/api/")) {
    const isAdminApi =
      pathname === "/api/strategies" || pathname.startsWith("/api/strategies/");
    const isAuthApi = pathname.startsWith("/api/auth/");

    if (isAdminApi && !adminEnabled) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (adminOnly && !isAdminApi && !isAuthApi) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.next();
  }

  // Strip locale prefix to get the effective path
  const localePrefix = routing.locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  const effectivePath = localePrefix
    ? pathname.slice(`/${localePrefix}`.length) || "/"
    : pathname;
  const isAdminPath = effectivePath === "/admin" || effectivePath.startsWith("/admin/");

  // C端部署默认不暴露后台入口；Admin 专用部署再单独开启。
  if (isAdminPath && !adminEnabled) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Admin 专用部署只开放登录页和后台页面，避免被当作 C 端产品访问。
  if (
    adminOnly &&
    localePrefix &&
    !isAdminPath &&
    effectivePath !== "/login"
  ) {
    return NextResponse.redirect(
      new URL(`/${localePrefix}/admin/strategies`, request.url)
    );
  }

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login"];
  const isPublic = publicPaths.includes(effectivePath);
  const sessionCookie = request.cookies.get("session")?.value;

  // Unauthenticated user trying to access protected route -> login
  if (localePrefix && !isPublic && !sessionCookie) {
    const loginUrl = new URL(`/${localePrefix}/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user on /login -> redirect into app
  if (localePrefix && effectivePath === "/login" && sessionCookie) {
    if (adminOnly && adminEnabled) {
      return NextResponse.redirect(
        new URL(`/${localePrefix}/admin/strategies`, request.url)
      );
    }
    return NextResponse.redirect(
      new URL(`/${localePrefix}/welcome`, request.url)
    );
  }

  // Let next-intl handle locale detection and root redirect
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};
