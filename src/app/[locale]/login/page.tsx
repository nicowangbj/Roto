"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import RotoAvatar from "@/components/RotoAvatar";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("login");
  const tc = useTranslations("common");

  function switchLocale() {
    const targetLocale = locale === "en" ? "zh" : "en";
    router.push(pathname.replace(`/${locale}`, `/${targetLocale}`));
  }
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { name, email, password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || tc("operationFailed"));
        return;
      }

      router.push(`/${locale}/welcome`);
    } catch {
      setError(tc("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="roto-grid min-h-screen flex flex-col relative overflow-hidden">
      <div className="glow-purple" style={{ top: "-200px", left: "-100px" }} />
      <div
        className="glow-cyan"
        style={{ bottom: "-200px", right: "-100px" }}
      />

      <header className="relative z-10 px-6 md:px-8 py-5 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/80 border border-border roto-panel flex items-center justify-center text-lg font-black text-brand-ink">
            R
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-brand-ink">Roto</div>
            <div className="text-xs text-text-muted">AI research mentor</div>
          </div>
        </Link>
        <button
          onClick={switchLocale}
          className="px-2.5 py-1.5 text-xs font-semibold text-text-muted hover:text-accent hover:bg-accent/8 rounded-xl transition-colors border border-border"
        >
          {locale === "en" ? "中" : "EN"}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10 px-6 pb-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-[1.02fr_0.98fr] gap-8 items-center">
          <section className="hidden lg:block">
            <div className="roto-panel rounded-[32px] p-10 bg-gradient-to-br from-white/90 via-brand-cloud/55 to-brand-sky-soft/80">
              <div className="inline-flex rounded-full bg-purple/22 px-4 py-2 text-sm font-semibold text-brand-ink">
                {t("welcome")}
              </div>
              <h1 className="mt-5 text-5xl font-black leading-[1.06] text-brand-ink">
                {t("headline1")}
                <span className="block bg-gradient-to-r from-brand-sky-deep to-brand-sun-deep bg-clip-text text-transparent">
                  {t("headline2")}
                </span>
              </h1>
              <p className="mt-5 text-lg text-text-dim max-w-xl">{t("subtitle")}</p>

              <div className="mt-8 flex items-center gap-6">
                <RotoAvatar size="lg" scene="signin" className="shrink-0" />
                <div className="space-y-3">
                  {(["bullet1", "bullet2", "bullet3"] as const).map((key) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-white/70 bg-white/82 px-4 py-3 text-sm text-text-dim shadow-sm"
                    >
                      {t(key)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-[24px] border border-accent/12 bg-brand-sky-soft px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  {t("rotaSays")}
                </div>
                <div className="mt-2 text-base font-semibold text-brand-ink">
                  {t("rotaSaysQuote")}
                </div>
              </div>
            </div>
          </section>

          <div className="w-full max-w-md lg:ml-auto">
            <div className="roto-panel rounded-[32px] p-8 bg-white/90">
              <div className="mb-6 lg:hidden flex items-center gap-3">
                <RotoAvatar size="sm" scene="signin" />
                <div>
                  <div className="text-lg font-bold text-brand-ink">Roto</div>
                  <div className="text-sm text-text-dim">{t("rotaMobile")}</div>
                </div>
              </div>

              <div className="flex bg-surface2 rounded-2xl p-1.5 mb-8">
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    mode === "login" ? "bg-white text-accent shadow-sm" : "text-text-muted hover:text-text-dim"
                  }`}
                >
                  {t("tabLogin")}
                </button>
                <button
                  onClick={() => { setMode("register"); setError(""); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    mode === "register" ? "bg-white text-accent shadow-sm" : "text-text-muted hover:text-text-dim"
                  }`}
                >
                  {t("tabRegister")}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-dim mb-1.5">
                      {t("nameLabel")}
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("namePlaceholder")}
                      required
                      className="w-full px-4 py-3 bg-surface2 border border-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-dim mb-1.5">
                    {t("emailLabel")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    required
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-text-dim mb-1.5">
                    {t("passwordLabel")}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? t("passwordPlaceholderRegister") : t("passwordPlaceholderLogin")}
                    required
                    minLength={mode === "register" ? 6 : undefined}
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                  />
                </div>

                {error && (
                  <div className="text-sm text-rose bg-rose/5 border border-rose/20 rounded-2xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-accent/20"
                >
                  {loading ? tc("processing") : mode === "login" ? t("loginBtn") : t("registerBtn")}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-text-muted">
                {mode === "login" ? t("hintLogin") : t("hintRegister")}
              </p>
            </div>

            <div className="text-center mt-6">
              <Link href={`/${locale}`} className="text-sm text-text-muted hover:text-accent transition-colors">
                {t("backHome")}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
