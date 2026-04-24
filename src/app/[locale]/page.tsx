"use client";

import Link from "next/link";
import RotoAvatar from "@/components/RotoAvatar";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export default function Home() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale() {
    const targetLocale = locale === "en" ? "zh" : "en";
    router.push(pathname.replace(`/${locale}`, `/${targetLocale}`));
  }

  const features = [
    {
      titleKey: "feature1Title",
      descKey: "feature1Desc",
      illustration: <MentorIllustration />,
      accent: "from-purple/8 to-purple/4",
      border: "border-purple/15",
    },
    {
      titleKey: "feature2Title",
      descKey: "feature2Desc",
      illustration: <StepsIllustration />,
      accent: "from-accent/8 to-accent/4",
      border: "border-accent/15",
    },
    {
      titleKey: "feature3Title",
      descKey: "feature3Desc",
      illustration: <MapIllustration />,
      accent: "from-green/8 to-green/4",
      border: "border-green/15",
    },
    {
      titleKey: "feature4Title",
      descKey: "feature4Desc",
      illustration: <JournalIllustration />,
      accent: "from-cyan/8 to-cyan/4",
      border: "border-cyan/15",
    },
  ];

  const stages = [
    { step: "01", titleKey: "stage01Title", descKey: "stage01Desc", icon: <Stage01Icon /> },
    { step: "02", titleKey: "stage02Title", descKey: "stage02Desc", icon: <Stage02Icon /> },
    { step: "03", titleKey: "stage03Title", descKey: "stage03Desc", icon: <Stage03Icon /> },
    { step: "04", titleKey: "stage04Title", descKey: "stage04Desc", icon: <Stage04Icon /> },
  ];

  const tags = ["tag1", "tag2", "tag3", "tag4"] as const;

  return (
    <div className="roto-grid min-h-screen flex flex-col relative overflow-hidden">
      <div className="glow-purple" style={{ top: "-200px", left: "-100px" }} />
      <div className="glow-cyan" style={{ bottom: "-200px", right: "-100px" }} />

      {/* Header */}
      <header className="relative z-10 px-6 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/80 border border-border roto-panel flex items-center justify-center text-lg font-black text-brand-ink">
            R
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">Roto</div>
            <div className="text-xs text-text-muted">{t("aiMentor")}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={switchLocale}
            className="px-2.5 py-1.5 text-xs font-semibold text-text-muted hover:text-accent hover:bg-accent/8 rounded-xl transition-colors border border-border"
          >
            {locale === "en" ? "中" : "EN"}
          </button>
          <Link
            href={`/${locale}/login`}
            className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-2xl transition-colors shadow-lg shadow-accent/20"
          >
            {t("loginRegister")}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-4 md:pt-6 pb-0">
        {/* Top row: text left, IP right — same height */}
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-0 items-stretch min-h-[420px]">

          {/* Left: all text, vertically centered */}
          <div className="flex-1 flex flex-col justify-center py-8 pr-0 lg:pr-12">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.04] text-brand-ink">
              {t("headline1")}
              <span className="block bg-gradient-to-r from-brand-sky-deep via-accent to-brand-sun-deep bg-clip-text text-transparent">
                {t("headline2")}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg md:text-xl text-text-dim leading-relaxed">
              {t("subheadline")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/login`}
                className="px-8 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-accent/20"
              >
                {t("cta")}
              </Link>
              <a
                href="#features"
                className="px-8 py-3.5 bg-white/78 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-2xl transition-colors roto-panel"
              >
                {t("ctaSecondary")}
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {tags.map((key) => (
                <span key={key} className="rounded-full border border-border bg-white/72 px-3.5 py-1.5 text-text-dim roto-panel">
                  {t(key)}
                </span>
              ))}
            </div>
          </div>

          {/* Right: IP image flush to bottom */}
          <div className="hidden lg:flex items-end justify-center w-[340px] shrink-0">
            <RotoAvatar size="xl" scene="hero" />
          </div>
        </div>

        {/* Info strip — 3 cards in a row, flush below hero */}
        <div className="max-w-6xl mx-auto mt-8 pb-16 grid md:grid-cols-3 gap-4">
          <div className="roto-panel rounded-2xl bg-brand-cloud/60 border border-purple/20 px-5 py-4">
            <div className="text-xs font-bold text-purple/60 uppercase tracking-widest mb-2">{t("rotaTask")}</div>
            <p className="text-sm text-brand-ink leading-relaxed">{t("rotaTaskDesc")}</p>
          </div>
          <div className="roto-panel rounded-2xl bg-brand-sky-soft border border-accent/20 px-5 py-4">
            <div className="text-xs font-bold text-accent/60 uppercase tracking-widest mb-2">{t("rotaVibe")}</div>
            <p className="text-sm text-brand-ink leading-relaxed">{t("rotaVibeDesc")}</p>
          </div>
          <div className="roto-panel rounded-2xl bg-white/85 border border-border px-5 py-4">
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">{t("rotaSays")}</div>
            <p className="text-sm font-semibold text-brand-ink italic leading-relaxed">{t("rotaSaysQuote")}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 pb-18">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-brand-ink">{t("featuresTitle")}</h2>
            <p className="mt-3 text-text-dim max-w-2xl mx-auto">{t("featuresSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.titleKey}
                className={`roto-panel rounded-[28px] overflow-hidden border ${feature.border} transition-transform hover:-translate-y-1`}
              >
                {/* Illustration area */}
                <div className={`bg-gradient-to-br ${feature.accent} px-6 pt-6 pb-4`}>
                  {feature.illustration}
                </div>
                {/* Text area */}
                <div className="px-7 py-6">
                  <h3 className="text-xl font-black text-brand-ink">{t(feature.titleKey as Parameters<typeof t>[0])}</h3>
                  <p className="mt-2 text-text-dim leading-relaxed">{t(feature.descKey as Parameters<typeof t>[0])}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 pb-18">
        <div className="max-w-6xl mx-auto roto-panel rounded-[32px] p-8 md:p-10 bg-gradient-to-br from-white/92 via-brand-cloud/56 to-brand-sky-soft/70">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-black text-brand-ink">{t("howTitle")}</h2>
            <p className="mt-3 text-text-dim">{t("howSubtitle")}</p>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-4">
            {stages.map((stage) => (
              <div
                key={stage.step}
                className="rounded-[24px] border border-white/70 bg-white/82 p-5 shadow-sm flex gap-4 items-start"
              >
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-white border border-border/60 flex items-center justify-center shadow-sm">
                  {stage.icon}
                </div>
                <div>
                  <div className="text-xs font-black text-accent/60 mb-1">{stage.step}</div>
                  <h3 className="text-base font-black text-brand-ink">{t(stage.titleKey as Parameters<typeof t>[0])}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-dim">{t(stage.descKey as Parameters<typeof t>[0])}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto text-center roto-panel rounded-[32px] p-10 bg-gradient-to-br from-brand-sky-soft via-white to-brand-cloud/72">
          <h2 className="text-3xl md:text-4xl font-black text-brand-ink">{t("ctaTitle")}</h2>
          <p className="mt-4 text-text-dim max-w-2xl mx-auto">{t("ctaSubtitle")}</p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href={`/${locale}/login`}
              className="inline-block px-8 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-accent/20"
            >
              {t("startBtn")}
            </Link>
            <a
              href="#features"
              className="inline-block px-8 py-3.5 bg-white/82 border border-border text-text-dim font-semibold rounded-2xl transition-colors hover:border-accent hover:text-accent"
            >
              {t("reviewBtn")}
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 pb-8 text-center">
        <span className="inline-block px-4 py-1.5 bg-white/76 border border-border text-accent text-xs font-semibold rounded-full roto-panel">
          {t("footerTag")}
        </span>
      </footer>
    </div>
  );
}

/* ── Feature illustrations ─────────────────────────────── */

function MentorIllustration() {
  return (
    <div className="space-y-2 select-none">
      <div className="flex items-end gap-2">
        <div className="w-6 h-6 rounded-full bg-purple/30 flex items-center justify-center text-[10px] shrink-0">R</div>
        <div className="bg-white/90 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-text-dim shadow-sm max-w-[80%]">
          Where exactly are you stuck?
        </div>
      </div>
      <div className="flex items-end gap-2 justify-end">
        <div className="bg-purple/15 rounded-2xl rounded-br-sm px-3 py-2 text-xs text-brand-ink max-w-[75%]">
          I don't know where to start...
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="w-6 h-6 rounded-full bg-purple/30 flex items-center justify-center text-[10px] shrink-0">R</div>
        <div className="bg-white/90 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-text-dim shadow-sm max-w-[80%]">
          Let's break it down — tell me one thing you do know.
        </div>
      </div>
    </div>
  );
}

function StepsIllustration() {
  const steps = [
    { label: "Identify your topic", done: true },
    { label: "Create research plan", done: true },
    { label: "Collect data", done: false, active: true },
    { label: "Analyze results", done: false },
  ];
  return (
    <div className="space-y-2 select-none">
      {steps.map((s, i) => (
        <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${
          s.active ? "bg-accent/15 border border-accent/25" : s.done ? "bg-white/50" : "bg-white/30 opacity-50"
        }`}>
          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
            s.done ? "bg-green text-white" : s.active ? "bg-accent/20 border-2 border-accent" : "border-2 border-border"
          }`}>
            {s.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            {s.active && <div className="w-2 h-2 rounded-sm bg-accent" />}
          </div>
          <span className={s.done ? "line-through text-text-muted" : s.active ? "font-semibold text-accent" : "text-text-muted"}>
            {s.label}
          </span>
          {s.active && <span className="ml-auto text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-full">Now</span>}
        </div>
      ))}
    </div>
  );
}

function MapIllustration() {
  const nodes = [
    { label: "Phase 1", done: true },
    { label: "Phase 2", done: true },
    { label: "Phase 3", active: true },
    { label: "Phase 4", locked: true },
    { label: "Phase 5", locked: true },
  ];
  return (
    <div className="select-none">
      <div className="flex items-center gap-1.5">
        {nodes.map((n, i) => (
          <div key={i} className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${
                n.done ? "bg-green border-green text-white" :
                n.active ? "bg-accent border-accent text-white shadow-lg shadow-accent/40 animate-pulse" :
                "bg-white/50 border-border/50 text-text-muted"
              }`}>
                {n.done ? "✓" : n.active ? "→" : "○"}
              </div>
              <span className="text-[9px] text-text-muted truncate w-full text-center">{n.label}</span>
            </div>
            {i < nodes.length - 1 && (
              <div className={`h-0.5 w-4 shrink-0 -mt-4 ${n.done ? "bg-green/40" : "bg-border/40"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 bg-white/60 rounded-xl px-3 py-2 flex items-center gap-2">
        <div className="flex-1 bg-border/30 rounded-full h-1.5 overflow-hidden">
          <div className="bg-green h-full rounded-full" style={{ width: "42%" }} />
        </div>
        <span className="text-[10px] text-text-muted shrink-0">42%</span>
      </div>
    </div>
  );
}

/* ── Stage icons ───────────────────────────────────────── */

function Stage01Icon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      {/* Person silhouette */}
      <circle cx="16" cy="10" r="5" fill="#6366f1" opacity="0.15" />
      <circle cx="16" cy="10" r="3" fill="#6366f1" opacity="0.5" />
      <path d="M8 26c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      {/* Interest sparks */}
      <circle cx="24" cy="8" r="1.5" fill="#f59e0b" opacity="0.7" />
      <circle cx="26" cy="13" r="1" fill="#3b82f6" opacity="0.6" />
      <circle cx="22" cy="5" r="1" fill="#10b981" opacity="0.6" />
    </svg>
  );
}

function Stage02Icon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="14" cy="14" r="7" stroke="#6366f1" strokeWidth="1.8" opacity="0.4" />
      <circle cx="14" cy="14" r="4" fill="#6366f1" opacity="0.12" />
      <path d="M19.5 19.5L25 25" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M11 14l2 2 4-4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

function Stage03Icon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="7" y="6" width="18" height="20" rx="3" fill="#10b981" opacity="0.1" />
      <rect x="7" y="6" width="18" height="20" rx="3" stroke="#10b981" strokeWidth="1.5" opacity="0.3" />
      <path d="M11 12l1.5 1.5L16 10" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <path d="M11 17l1.5 1.5L16 15" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <path d="M11 22h6" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <path d="M19 12h3M19 17h3" stroke="#10b981" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

function Stage04Icon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 8v16" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.4" />
      <path d="M7 8c2.5 0 6 1 9 3V24c-3-1.5-6.5-2-9-2V8z" fill="#0ea5e9" opacity="0.12" />
      <path d="M7 8c2.5 0 6 1 9 3V24c-3-1.5-6.5-2-9-2V8z" stroke="#0ea5e9" strokeWidth="1.3" opacity="0.35" />
      <path d="M25 8c-2.5 0-6 1-9 3V24c3-1.5 6.5-2 9-2V8z" fill="#0ea5e9" opacity="0.12" />
      <path d="M25 8c-2.5 0-6 1-9 3V24c3-1.5 6.5-2 9-2V8z" stroke="#0ea5e9" strokeWidth="1.3" opacity="0.35" />
      <path d="M10 13h4M10 16h4M10 19h3" stroke="#0ea5e9" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M21 13l.6 1.8h1.9l-1.5 1.1.6 1.8-1.6-1.2-1.6 1.2.6-1.8-1.5-1.1h1.9z" fill="#0ea5e9" opacity="0.45" />
    </svg>
  );
}

function JournalIllustration() {
  return (
    <div className="space-y-2 select-none">
      {[
        { week: "Week 3", title: "Finally got my survey designed", tag: "Task" },
        { week: "Week 5", title: "Data collection phase begins", tag: "Phase" },
      ].map((entry, i) => (
        <div key={i} className="bg-white/80 rounded-xl px-3 py-2.5 flex items-start gap-3 shadow-sm">
          <div className="w-1 h-full min-h-[36px] rounded-full bg-cyan/50 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] text-cyan font-semibold">{entry.week}</span>
              <span className="text-[9px] bg-cyan/10 text-cyan px-1.5 py-0.5 rounded-full">{entry.tag}</span>
            </div>
            <p className="text-xs text-text-dim truncate">{entry.title}</p>
          </div>
        </div>
      ))}
      <div className="text-center text-[10px] text-text-muted pt-1">12 entries recorded</div>
    </div>
  );
}
