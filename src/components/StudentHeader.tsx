"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export default function StudentHeader() {
  const t = useTranslations("studentHeader");
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  function switchLocale() {
    const targetLocale = locale === "en" ? "zh" : "en";
    const newPath = pathname.replace(`/${locale}`, `/${targetLocale}`);
    router.push(newPath);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.name) setUserName(data.name);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${locale}/login`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/78 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href={`/${locale}/map`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl border border-border bg-white/85 roto-panel flex items-center justify-center text-base font-black text-brand-ink">
            R
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-brand-ink">
              Roto
            </div>
            <div className="text-[11px] text-text-muted">mentor mode</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href={`/${locale}/map`}
            className="px-3 py-1.5 text-sm text-text-dim hover:text-accent hover:bg-accent/6 rounded-xl transition-colors"
          >
            {t("map")}
          </Link>
          <Link
            href={`/${locale}/journal`}
            className="px-3 py-1.5 text-sm text-text-dim hover:text-accent hover:bg-accent/6 rounded-xl transition-colors"
          >
            {t("journal")}
          </Link>
          <Link
            href={`/${locale}/adjust`}
            className="px-3 py-1.5 text-sm text-text-dim hover:text-accent hover:bg-accent/6 rounded-xl transition-colors"
          >
            {t("adjust")}
          </Link>
          <Link
            href={`/${locale}/profile`}
            className="px-3 py-1.5 text-sm text-text-dim hover:text-accent hover:bg-accent/6 rounded-xl transition-colors"
          >
            {t("profile")}
          </Link>
          <div className="w-px h-5 bg-border mx-2" />
          <button
            onClick={switchLocale}
            className="px-2.5 py-1 text-xs font-semibold text-text-muted hover:text-accent hover:bg-accent/8 rounded-lg transition-colors border border-border"
          >
            {locale === "en" ? "中" : "EN"}
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          {userName && (
            <span className="text-sm text-text-muted mr-1">{userName}</span>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-3 py-1.5 text-sm text-text-muted hover:text-rose hover:bg-rose/5 rounded-lg transition-colors"
          >
            {loggingOut ? t("loggingOut") : t("logout")}
          </button>
        </nav>
      </div>
    </header>
  );
}
