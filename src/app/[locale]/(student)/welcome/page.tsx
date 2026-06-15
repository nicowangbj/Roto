"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import RotoAvatar from "@/components/RotoAvatar";

interface Project {
  id: string;
  title: string;
  status: string;
  topic: { name: string } | null;
  createdAt: string;
  phases: { tasks: { status: string }[] }[];
}

export default function WelcomePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("welcome");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    topic_selection: { label: t("statusTopicSelection"), color: "text-purple", bg: "bg-purple/10" },
    planning: { label: t("statusPlanning"), color: "text-cyan", bg: "bg-cyan/10" },
    executing: { label: t("statusExecuting"), color: "text-green", bg: "bg-green/10" },
    adjusting: { label: t("statusAdjusting"), color: "text-amber", bg: "bg-amber/10" },
    completed: { label: t("statusCompleted"), color: "text-green", bg: "bg-green/10" },
    archived: { label: t("statusArchived"), color: "text-text-muted", bg: "bg-surface2" },
  };

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to load projects");
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch {
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      <div className="roto-panel rounded-[32px] p-8 md:p-10 bg-gradient-to-br from-white/92 via-brand-cloud/58 to-brand-sky-soft/78">
        <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
          <div className="flex justify-center md:justify-start">
            <RotoAvatar size="xl" scene="welcome" />
          </div>
          <div>
            <div className="inline-flex rounded-full bg-purple/22 px-4 py-2 text-sm font-semibold text-brand-ink">
              {t("badge")}
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-brand-ink">
              {t("title1")}
              <span className="block text-accent">{t("title2")}</span>
            </h1>
            <p className="mt-4 text-lg text-text-dim leading-relaxed">
              {t("intro")}
            </p>
            <div className="mt-6 rounded-[24px] border border-accent/12 bg-white/76 px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {t("rotaSays")}
              </div>
              <div className="mt-2 text-base font-semibold text-brand-ink">
                {t("rotaQuote")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => router.push(`/${locale}/topic/chat?fresh=1`)}
          className="group relative roto-panel rounded-[28px] p-8 text-left hover:-translate-y-1 transition-all bg-white/88"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple to-accent rounded-t-[28px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 rounded-2xl bg-purple/20 flex items-center justify-center text-2xl mb-5">
            🧭
          </div>
          <h3 className="text-xl font-black mb-2 group-hover:text-brand-ink transition-colors">
            {t("noTopic")}
          </h3>
          <p className="text-sm text-text-dim leading-relaxed">
            {t("noTopicDesc")}
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-brand-ink opacity-0 group-hover:opacity-100 transition-opacity">
            {t("noTopicCta")} <span>→</span>
          </div>
        </button>

        <button
          onClick={() => router.push(`/${locale}/topic/confirm?path=has_topic&fresh=1`)}
          className="group relative roto-panel rounded-[28px] p-8 text-left hover:-translate-y-1 transition-all bg-white/88"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent to-cyan rounded-t-[28px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 rounded-2xl bg-accent/12 flex items-center justify-center text-2xl mb-5">
            🎯
          </div>
          <h3 className="text-xl font-black mb-2 group-hover:text-accent transition-colors">
            {t("hasTopic")}
          </h3>
          <p className="text-sm text-text-dim leading-relaxed">
            {t("hasTopicDesc")}
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
            {t("hasTopicCta")} <span>→</span>
          </div>
        </button>
      </div>

      <section className="roto-panel rounded-[28px] bg-white/88 border border-border p-6 md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-brand-ink">{t("projectsTitle")}</h2>
            <p className="mt-1 text-sm text-text-dim">{t("projectsSubtitle")}</p>
          </div>
          <button
            onClick={() => router.push(`/${locale}/topic/chat?fresh=1`)}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-accent/20"
          >
            {t("newProject")}
          </button>
        </div>

        {loadingProjects ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-9 h-9 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface2/45 p-8 text-center">
            <p className="text-sm text-text-dim mb-4">{t("projectsEmpty")}</p>
            <button
              onClick={() => router.push(`/${locale}/topic/chat?fresh=1`)}
              className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {t("startFirstProject")}
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => {
              const totalTasks = project.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
              const completedTasks = project.phases.reduce(
                (sum, phase) =>
                  sum + phase.tasks.filter((task) => task.status === "completed" || task.status === "graded").length,
                0
              );
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              const status = statusConfig[project.status] || statusConfig.executing;

              return (
                <button
                  key={project.id}
                  onClick={() => router.push(`/${locale}/map?projectId=${project.id}`)}
                  className="group w-full rounded-2xl border border-border bg-white px-5 py-4 text-left transition-all hover:border-accent hover:shadow-md hover:shadow-accent/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-text group-hover:text-accent transition-colors line-clamp-2">
                        {project.topic?.name || project.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                        <span>{new Date(project.createdAt).toLocaleDateString(locale)}</span>
                        <span>{t("taskProgress", { done: completedTasks, total: totalTasks })}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface2">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-accent">{progress}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
