import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { isAdminEmail, isAdminEnabled } from "@/lib/admin";
import { getSessionUser } from "@/lib/session-user";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAdminEnabled()) {
    notFound();
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/admin/strategies`);
  }
  if (!isAdminEmail(user.email)) {
    notFound();
  }

  const t = await getTranslations("admin");

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/admin/strategies" className="text-lg font-bold tracking-tight">
            Roto <span className="text-accent">{t("adminPanel")}</span>
          </Link>
          <Link href="/" className="text-sm text-text-muted hover:text-accent transition-colors">
            {t("backHome")}
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
