"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

interface Project {
  id: string;
  title: string;
  topic: { name: string } | null;
  phases: { name: string; tasks: { status: string }[] }[];
}

export default function CompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [project, setProject] = useState<Project | null>(null);
  const t = useTranslations("complete");
  const locale = useLocale();

  useEffect(() => {
    async function fetchProject() {
      const res = await fetch("/api/projects");
      const projects = await res.json();
      setProject(projects.find((item: Project) => item.id === projectId) || projects[0] || null);
    }
    fetchProject();
  }, [projectId]);

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      {/* Celebration area */}
      <div className="mb-10">
        <div className="relative inline-block">
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-green/10 to-cyan/10 border-2 border-green flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green/20">
            <span className="text-5xl">🏆</span>
          </div>
          {/* Decorative sparkles */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber rounded-full animate-ping" />
          <div className="absolute -bottom-1 -left-3 w-3 h-3 bg-accent rounded-full animate-ping [animation-delay:0.3s]" />
        </div>
        <h1 className="text-3xl font-extrabold mb-3 text-text">{t("title")}</h1>
        <p className="text-text-dim text-lg">
          {project?.topic?.name || t("defaultTopic")}
        </p>
      </div>

      {/* Achievement decoration */}
      <div className="mb-8">
        <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[28px] border border-green/20 bg-gradient-to-br from-green/10 via-cyan/10 to-amber/10 px-6 py-5 shadow-sm">
          <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-white/45" />
          <div className="absolute -right-8 -bottom-12 h-28 w-28 rounded-full bg-amber/20" />
          <div className="relative flex items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-green/15">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <circle cx="18" cy="14" r="8" fill="#FBBF24" />
                <path d="M13 21 9 32l9-4 9 4-4-11" fill="#22C55E" />
                <path d="m14.5 14 2.5 2.5 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-green">{t("title")}</p>
              <p className="mt-1 text-sm font-semibold text-brand-ink">{project?.topic?.name || t("defaultTopic")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Research summary */}
      <div className="bg-white rounded-2xl border border-border p-8 mb-8 text-left">
        <h2 className="text-lg font-bold mb-5 text-center text-text">{t("summaryTitle")}</h2>
        {project?.phases.map((phase, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
            <div className="w-7 h-7 rounded-lg bg-green/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7L6 10L11 4" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-text-dim flex-1">{phase.name}</span>
            <span className="text-xs text-text-muted bg-surface2 px-2.5 py-1 rounded-full">
              {t("tasks", { n: phase.tasks.length })}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => router.push(`/${locale}/journal${project?.id ? `?projectId=${project.id}` : ""}`)}
          className="px-8 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
        >
          {t("viewJournal")}
        </button>
        <button
          onClick={() => router.push(`/${locale}/welcome`)}
          className="px-8 py-3.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
        >
          {t("startNew")}
        </button>
      </div>
    </div>
  );
}
