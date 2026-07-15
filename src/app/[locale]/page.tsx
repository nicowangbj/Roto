"use client";

import Link from "next/link";
import RotoAvatar from "@/components/RotoAvatar";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import PersonalLanding from "@/components/landing/PersonalLanding";
import { appVariant } from "@/lib/app-variant";

export default function Home() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  if (appVariant === "personal") {
    return <PersonalLanding />;
  }

  function switchLocale() {
    const targetLocale = locale === "en" ? "zh" : "en";
    router.push(pathname.replace(`/${locale}`, `/${targetLocale}`));
  }

  const programmes = [
    { key: "programmeEe", desc: "programmeEeDesc", accent: "border-accent/25 bg-accent/8 text-accent" },
    { key: "programmeEpq", desc: "programmeEpqDesc", accent: "border-green/25 bg-green/8 text-green" },
    { key: "programmeIndependent", desc: "programmeIndependentDesc", accent: "border-amber/25 bg-amber/10 text-amber" },
  ] as const;

  const journey = [
    "journeyQuestion",
    "journeyPlan",
    "journeySources",
    "journeyDraft",
    "journeyReflect",
    "journeySubmit",
  ] as const;

  const supervision = [
    "schoolFeatureClasses",
    "schoolFeatureProgress",
    "schoolFeatureApprovals",
    "schoolFeatureRubrics",
  ] as const;

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white/86 text-lg font-black text-brand-ink shadow-sm">
            R
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-brand-ink">Roto</div>
            <div className="text-xs text-text-muted">{t("brandLine")}</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/school`}
            className="hidden rounded-xl border border-border bg-white/74 px-4 py-2 text-sm font-semibold text-text-dim transition-colors hover:border-accent hover:text-accent sm:inline-flex"
          >
            {t("schoolNav")}
          </Link>
          <button
            onClick={switchLocale}
            className="rounded-xl border border-border bg-white/74 px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-accent/8 hover:text-accent"
          >
            {locale === "en" ? "中" : "EN"}
          </button>
          <Link
            href={`/${locale}/login`}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent/90"
          >
            {t("loginRegister")}
          </Link>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden px-6 pb-14 pt-6 md:px-8 md:pb-18">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_28%,rgba(255,216,77,0.30),transparent_28%),radial-gradient(circle_at_18%_8%,rgba(71,168,255,0.16),transparent_30%)]" />
          <div className="absolute right-[-32px] top-12 -z-10 opacity-25 lg:hidden">
            <RotoAvatar size="lg" scene="hero" />
          </div>
          <div className="absolute bottom-0 right-[6%] -z-10 hidden opacity-95 lg:block">
            <RotoAvatar size="xl" scene="hero" className="scale-110" />
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl py-10 md:py-16 lg:min-h-[560px] lg:py-24">
              <div className="inline-flex rounded-full border border-accent/20 bg-white/78 px-4 py-2 text-sm font-bold text-accent shadow-sm">
                {t("heroBadge")}
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-brand-ink md:text-6xl">
                {t("headline1")}
                <span className="block text-accent">{t("headline2")}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-dim md:text-xl">
                {t("subheadline")}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/${locale}/login`}
                  className="rounded-2xl bg-accent px-7 py-3.5 text-center font-bold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent/90"
                >
                  {t("ctaStudent")}
                </Link>
                <Link
                  href={`/${locale}/school`}
                  className="rounded-2xl border border-border bg-white/82 px-7 py-3.5 text-center font-bold text-text-dim shadow-sm transition-colors hover:border-accent hover:text-accent"
                >
                  {t("ctaSchool")}
                </Link>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                {["heroStat1", "heroStat2", "heroStat3"].map((key) => (
                  <div key={key} className="rounded-2xl border border-border bg-white/76 px-4 py-3 shadow-sm">
                    <p className="text-sm font-bold text-brand-ink">{t(key as Parameters<typeof t>[0])}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-white/58 px-6 py-12 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">{t("programmesEyebrow")}</p>
              <h2 className="mt-3 text-3xl font-black text-brand-ink md:text-4xl">{t("programmesTitle")}</h2>
              <p className="mt-3 text-text-dim">{t("programmesSubtitle")}</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {programmes.map((item) => (
                <article key={item.key} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className={`mb-5 inline-flex rounded-full border px-3 py-1 text-sm font-black ${item.accent}`}>
                    {t(item.key)}
                  </div>
                  <p className="leading-relaxed text-text-dim">{t(item.desc)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-14 md:px-8 md:py-18">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-green">{t("journeyEyebrow")}</p>
              <h2 className="mt-3 text-3xl font-black text-brand-ink md:text-4xl">{t("journeyTitle")}</h2>
              <p className="mt-4 text-text-dim">{t("journeySubtitle")}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {journey.map((key, index) => (
                <div key={key} className="flex gap-4 rounded-2xl border border-border bg-white/88 p-5 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-black text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <p className="font-semibold leading-relaxed text-brand-ink">{t(key)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand-mist/70 px-6 py-14 md:px-8 md:py-18">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">{t("schoolEyebrow")}</p>
              <h2 className="mt-3 text-3xl font-black text-brand-ink md:text-4xl">{t("schoolTitle")}</h2>
              <p className="mt-4 text-text-dim">{t("schoolSubtitle")}</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {supervision.map((key) => (
                <div key={key} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-sm font-black text-accent">
                    R
                  </div>
                  <p className="text-sm font-bold leading-relaxed text-brand-ink">{t(key)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[28px] border border-border bg-white/78 p-6 shadow-sm md:p-7">
              <div className="grid gap-5 md:grid-cols-3">
                {["schoolIntro1", "schoolIntro2", "schoolIntro3"].map((key) => (
                  <div key={key}>
                    <p className="text-sm font-semibold leading-relaxed text-text-dim">
                      {t(key as Parameters<typeof t>[0])}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 md:px-8 md:py-18">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 rounded-[30px] border border-border bg-white p-7 shadow-sm md:grid-cols-[1fr_1.2fr] md:p-10">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-amber">{t("partnersEyebrow")}</p>
                <h2 className="mt-3 text-3xl font-black text-brand-ink md:text-4xl">{t("partnersTitle")}</h2>
              </div>
              <div>
                <p className="text-lg leading-relaxed text-text-dim">{t("partnersSubtitle")}</p>
                <p className="mt-4 text-sm leading-relaxed text-text-muted">{t("partnersNote")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-18 md:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-black text-brand-ink md:text-4xl">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-text-dim">{t("ctaSubtitle")}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={`/${locale}/school`}
                className="rounded-2xl bg-accent px-8 py-3.5 font-bold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent/90"
              >
                {t("schoolBtn")}
              </Link>
              <Link
                href={`/${locale}/login`}
                className="rounded-2xl border border-border bg-white px-8 py-3.5 font-bold text-text-dim transition-colors hover:border-accent hover:text-accent"
              >
                {t("studentBtn")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-text-muted">
        {t("footerTag")}
      </footer>
    </div>
  );
}
