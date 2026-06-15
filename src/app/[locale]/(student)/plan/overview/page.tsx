"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

interface Phase {
  id: string;
  order: number;
  name: string;
  description: string | null;
  goal: string | null;
  status: string;
  startWeek: number | null;
  endWeek: number | null;
}

interface Project {
  id: string;
  title: string;
  topic: {
    name: string;
    description: string | null;
    field: string | null;
    outputFormat: string | null;
    duration: string | null;
    weeklyHours: string | null;
  } | null;
  phases: Phase[];
}

const PHASE_COLORS = ["#6366f1", "#06b6d4", "#22c55e", "#f59e0b", "#f43f5e", "#a855f7"];
const PHASE_ICONS = ["📖", "🔍", "🧪", "📊", "✍️", "🎯"];

function getCoverTheme(title: string, field?: string | null) {
  const text = `${title} ${field ?? ""}`.toLowerCase();
  if (/price|pricing|market|econom|business|game theory|competition|经济/.test(text)) {
    return {
      from: "#fef3c7",
      via: "#fde68a",
      to: "#38bdf8",
      accent: "#0f766e",
    };
  }
  if (/psychology|mental|motivation|心理|动机/.test(text)) {
    return { from: "#f5d0fe", via: "#dbeafe", to: "#bae6fd", accent: "#7c3aed" };
  }
  if (/environment|climate|biology|green|环境|气候|生物/.test(text)) {
    return { from: "#dcfce7", via: "#bbf7d0", to: "#bae6fd", accent: "#16a34a" };
  }
  if (/ai|computer|technology|coding|python|技术|人工智能/.test(text)) {
    return { from: "#e0f2fe", via: "#ddd6fe", to: "#fef3c7", accent: "#2563eb" };
  }
  return { from: "#fff7ed", via: "#dbeafe", to: "#ede9fe", accent: "#6366f1" };
}

function formatForLocale(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  if (locale !== "en") return value;

  return value
    .replace(/研究报告/g, "Research report")
    .replace(/研究论文/g, "Research paper")
    .replace(/实验报告/g, "Experimental report")
    .replace(/调查报告/g, "Survey report")
    .replace(/报告/g, "Report")
    .replace(/每周\s*(\d+)\s*小时/g, "$1 hours/week")
    .replace(/(\d+)\s*小时/g, "$1 hours")
    .replace(/(\d+)\s*周/g, "$1 weeks");
}

function OverviewContent() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("planOverview");

  useEffect(() => {
    async function fetchProject() {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const projects = await res.json();
        const p = Array.isArray(projects) && projectId
          ? projects.find((item: Project) => item.id === projectId)
          : null;
        setProject(p ?? null);
      } else {
        setProject(null);
      }
      setLoading(false);
    }
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-text-dim">{t("loading")}</p>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-20 text-text-dim">{t("notFound")}</div>;
  }

  const totalWeeks = project.phases.length > 0
    ? Math.max(...project.phases.map((p) => p.endWeek || 0))
    : 0;
  const outputFormat =
    formatForLocale(project.topic?.outputFormat, locale) || t("defaultOutput");
  const weeklyHours =
    formatForLocale(project.topic?.weeklyHours, locale) || t("defaultWeeklyHours");
  const duration =
    formatForLocale(project.topic?.duration, locale) || t("defaultDuration");
  const topicTitle = project.topic?.name || project.title;
  const coverTheme = getCoverTheme(topicTitle, project.topic?.field);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Topic summary card */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden mb-8">
        <div className="h-2 bg-gradient-to-r from-accent via-purple to-cyan" />
        <div className="p-6 lg:p-8">
          <div className="flex items-start gap-5">
            <div
              className="relative shrink-0 h-24 w-24 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5"
              style={{
                background: `linear-gradient(135deg, ${coverTheme.from} 0%, ${coverTheme.via} 52%, ${coverTheme.to} 100%)`,
              }}
              aria-label={topicTitle}
            >
              <div className="absolute -right-5 -top-5 h-14 w-14 rounded-full bg-white/35" />
              <div className="absolute -bottom-7 -left-5 h-16 w-16 rounded-full bg-white/30" />
              <div className="absolute left-3 top-3 h-8 w-8 rounded-full bg-white/55 shadow-sm" />
              <div className="absolute right-4 top-4 h-3 w-3 rounded-full bg-white/70" />
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-white/25" />
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 96 96"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M0 76 C18 56 28 62 42 45 C54 30 70 44 96 20 V96 H0 Z"
                  fill="rgba(255,255,255,0.42)"
                />
                <path
                  d="M0 82 C20 68 34 74 50 58 C64 44 78 58 96 40 V96 H0 Z"
                  fill="rgba(255,255,255,0.36)"
                />
                <path
                  d="M16 62 C28 52 41 67 52 56 C63 45 72 48 84 35"
                  stroke="rgba(255,255,255,0.78)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M18 28 C34 22 45 32 58 25 C68 20 76 22 84 16"
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute bottom-4 left-4 right-4 flex items-end gap-1.5">
                {[18, 28, 14, 34, 22].map((height, index) => (
                  <span
                    key={index}
                    className="w-2 rounded-full bg-white/65 shadow-sm"
                    style={{ height }}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-text mb-2">{topicTitle}</h1>
              <p className="text-sm text-text-dim leading-relaxed mb-4">
                {project.topic?.description || t("defaultProjectDescription")}
              </p>
              <div className="flex flex-wrap gap-3">
                {project.topic?.field && (
                  <span className="px-3 py-1 bg-purple/10 text-purple text-xs font-medium rounded-full">
                    {project.topic.field}
                  </span>
                )}
                <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                  {totalWeeks > 0 ? `${totalWeeks} ${t("weeks")}` : duration}
                </span>
                <span className="px-3 py-1 bg-cyan/10 text-cyan text-xs font-medium rounded-full">
                  {outputFormat}
                </span>
                <span className="px-3 py-1 bg-amber/10 text-amber text-xs font-medium rounded-full">
                  {weeklyHours}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase timeline */}
      <h2 className="text-lg font-bold text-text mb-5">{t("phasesTitle")}</h2>
      <div className="relative pl-8 mb-8">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-accent via-cyan to-green" />

        {project.phases.map((phase, i) => {
          const color = PHASE_COLORS[i % PHASE_COLORS.length];
          const icon = PHASE_ICONS[i % PHASE_ICONS.length];
          return (
            <div key={phase.id} className="relative mb-6 last:mb-0">
              {/* Timeline dot */}
              <div
                className="absolute -left-8 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-lg z-10"
                style={{ background: color, boxShadow: `0 4px 12px ${color}40` }}
              >
                {phase.order}
              </div>

              {/* Phase card */}
              <div className="ml-6 bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-xl mt-0.5">{icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-text">{phase.name}</h3>
                      <span className="text-xs text-text-muted bg-surface2 px-2.5 py-1 rounded-full">
                        {t("weekRange", { start: phase.startWeek ?? "", end: phase.endWeek ?? "" })}
                      </span>
                    </div>
                    {phase.description && (
                      <p className="text-sm text-text-dim leading-relaxed">{phase.description}</p>
                    )}
                  </div>
                </div>

                {phase.goal && (
                  <div className="ml-9 mt-2 px-3 py-2 rounded-xl" style={{ background: `${color}10` }}>
                    <p className="text-xs" style={{ color }}>
                      <span className="font-semibold">{t("phaseGoal")}</span>{phase.goal}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall overview stats */}
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-accent">{project.phases.length}</p>
            <p className="text-xs text-text-muted mt-1">{t("statPhases")}</p>
          </div>
          <div className="stat-card p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-cyan">{totalWeeks || "—"}</p>
            <p className="text-xs text-text-muted mt-1">{t("statWeeks")}</p>
          </div>
        </div>
        <div className="stat-card p-5 rounded-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted mb-2">{t("statOutput")}</p>
          <p className="text-lg font-semibold text-green leading-snug">{outputFormat}</p>
        </div>
      </div>

      <button
        onClick={() => router.push(`/${locale}/plan/detail?projectId=${project.id}`)}
        className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
      >
        {t("viewDetail")}
      </button>
    </div>
  );
}

export default function PlanOverviewPage() {
  const tCommon = useTranslations("common");
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">{tCommon("loading")}</div></div>}>
      <OverviewContent />
    </Suspense>
  );
}
