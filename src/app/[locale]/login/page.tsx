"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import RotoAvatar from "@/components/RotoAvatar";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

type Mode = "login" | "register" | "resetRequest" | "resetConfirm";

function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  const t = useTranslations("login");

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-text-dim mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          autoComplete={autoComplete}
          className="w-full px-4 py-3 pr-16 bg-surface2 border border-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted hover:text-accent transition-colors"
          aria-label={visible ? t("hidePassword") : t("showPassword")}
        >
          {visible ? t("hidePassword") : t("showPassword")}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("login");
  const tc = useTranslations("common");

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRules = useMemo(
    () => [
      { label: t("passwordRuleLength"), met: password.length >= 8 },
      { label: t("passwordRuleLetters"), met: /[A-Za-z]/.test(password) },
      { label: t("passwordRuleNumbers"), met: /\d/.test(password) },
    ],
    [password, t]
  );
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("resetToken");
    if (token) {
      setResetToken(token);
      setMode("resetConfirm");
    }
  }, []);

  function switchLocale() {
    const targetLocale = locale === "en" ? "zh" : "en";
    router.push(pathname.replace(`/${locale}`, `/${targetLocale}`));
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setNotice("");
    setPassword("");
    setConfirmPassword("");
  }

  function getSubmitLabel() {
    if (loading && mode === "login") return t("loggingIn");
    if (loading && mode === "register") return t("creatingAccount");
    if (loading && mode === "resetRequest") return t("sendingReset");
    if (loading && mode === "resetConfirm") return t("updatingPassword");
    if (mode === "login") return t("loginBtn");
    if (mode === "register") return t("registerBtn");
    if (mode === "resetRequest") return t("sendResetLink");
    return t("updatePassword");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");

    if ((mode === "register" || mode === "resetConfirm") && !isStrongPassword(password)) {
      setError(t("passwordWeak"));
      return;
    }

    if ((mode === "register" || mode === "resetConfirm") && password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      let url = "/api/auth/login";
      let body: Record<string, string> = { email, password };

      if (mode === "register") {
        url = "/api/auth/register";
        body = { name, email, password };
      }

      if (mode === "resetRequest") {
        url = "/api/auth/password-reset/request";
        body = { email };
      }

      if (mode === "resetConfirm") {
        url = "/api/auth/password-reset/confirm";
        body = { token: resetToken, password };
      }

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

      if (mode === "resetRequest") {
        setNotice(data.message || t("resetEmailSent"));
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext =
        next && next.startsWith(`/${locale}/`) ? next : `/${locale}/welcome`;
      router.push(safeNext);
    } catch {
      setError(tc("networkError"));
    } finally {
      setLoading(false);
    }
  }

  const formTitle =
    mode === "login"
      ? t("loginTitle")
      : mode === "register"
        ? t("registerTitle")
        : mode === "resetRequest"
          ? t("resetTitle")
          : t("resetConfirmTitle");
  const formSubtitle =
    mode === "login"
      ? t("loginSubtitle")
      : mode === "register"
        ? t("registerSubtitle")
        : mode === "resetRequest"
          ? t("resetSubtitle")
          : t("resetConfirmSubtitle");

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
            <div className="roto-panel rounded-[32px] p-7 sm:p-8 bg-white/90">
              <div className="mb-6 lg:hidden flex items-center gap-3">
                <RotoAvatar size="sm" scene="signin" />
                <div>
                  <div className="text-lg font-bold text-brand-ink">Roto</div>
                  <div className="text-sm text-text-dim">{t("rotaMobile")}</div>
                </div>
              </div>

              <div className="mb-5">
                <h2 className="text-2xl font-black text-brand-ink">{formTitle}</h2>
                <p className="mt-1.5 text-sm leading-6 text-text-dim">{formSubtitle}</p>
              </div>

              {mode !== "resetConfirm" && (
                <div className="flex bg-surface2 rounded-2xl p-1.5 mb-6">
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                      mode === "login" ? "bg-white text-accent shadow-sm" : "text-text-muted hover:text-text-dim"
                    }`}
                  >
                    {t("tabLogin")}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                      mode === "register" ? "bg-white text-accent shadow-sm" : "text-text-muted hover:text-text-dim"
                    }`}
                  >
                    {t("tabRegister")}
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-text-dim mb-1.5">
                      {t("nameLabel")}
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("namePlaceholder")}
                      required
                      autoComplete="name"
                      className="w-full px-4 py-3 bg-surface2 border border-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                    />
                  </div>
                )}

                {(mode === "login" || mode === "register" || mode === "resetRequest") && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-text-dim mb-1.5">
                      {t("emailLabel")}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("emailPlaceholder")}
                      required
                      autoComplete="email"
                      className="w-full px-4 py-3 bg-surface2 border border-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                    />
                  </div>
                )}

                {(mode === "login" || mode === "register" || mode === "resetConfirm") && (
                  <PasswordField
                    id="password"
                    label={mode === "resetConfirm" ? t("newPasswordLabel") : t("passwordLabel")}
                    value={password}
                    onChange={setPassword}
                    placeholder={mode === "login" ? t("passwordPlaceholderLogin") : t("passwordPlaceholderRegister")}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                )}

                {(mode === "register" || mode === "resetConfirm") && (
                  <>
                    <div className="rounded-2xl bg-brand-cloud/45 border border-border px-4 py-3 space-y-1.5">
                      {passwordRules.map((rule) => (
                        <div
                          key={rule.label}
                          className={`text-xs font-medium ${rule.met ? "text-green" : "text-text-muted"}`}
                        >
                          {rule.met ? "✓" : "•"} {rule.label}
                        </div>
                      ))}
                    </div>
                    <PasswordField
                      id="confirmPassword"
                      label={t("confirmPasswordLabel")}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder={t("confirmPasswordPlaceholder")}
                      autoComplete="new-password"
                    />
                    {confirmPassword && (
                      <div className={`text-xs font-semibold ${passwordsMatch ? "text-green" : "text-rose"}`}>
                        {passwordsMatch ? t("passwordsMatch") : t("passwordMismatch")}
                      </div>
                    )}
                  </>
                )}

                {mode === "login" && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => switchMode("resetRequest")}
                      className="text-xs font-semibold text-text-muted hover:text-accent transition-colors"
                    >
                      {t("forgotPassword")}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-rose bg-rose/5 border border-rose/20 rounded-2xl px-4 py-3">
                    {error}
                  </div>
                )}

                {notice && (
                  <div className="text-sm text-green bg-green/8 border border-green/20 rounded-2xl px-4 py-3">
                    {notice}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-accent/20"
                >
                  {getSubmitLabel()}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-text-muted">
                {mode === "login" && (
                  <button type="button" onClick={() => switchMode("register")} className="hover:text-accent">
                    {t("hintLogin")}
                  </button>
                )}
                {mode === "register" && (
                  <button type="button" onClick={() => switchMode("login")} className="hover:text-accent">
                    {t("hintRegister")}
                  </button>
                )}
                {mode === "resetRequest" && (
                  <button type="button" onClick={() => switchMode("login")} className="hover:text-accent">
                    {t("backToLogin")}
                  </button>
                )}
                {mode === "resetConfirm" && t("resetConfirmHint")}
              </div>
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
