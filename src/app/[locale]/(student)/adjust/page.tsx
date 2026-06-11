"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import ChatWindow from "@/components/ChatWindow";

interface Project {
  id: string;
  title: string;
  topic: { name: string } | null;
  phases: { id: string; name: string; status: string; tasks: { status: string }[] }[];
}

export default function AdjustPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"select" | "chat">("select");
  const t = useTranslations("adjust");
  const locale = useLocale();

  useEffect(() => {
    async function fetchProject() {
      const res = await fetch("/api/projects");
      const projects = await res.json();
      setProject(projects.find((item: Project) => item.id === projectId) || projects[0] || null);
      setLoading(false);
    }
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-amber/20 border-t-amber rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-text-dim mb-4">{t("empty")}</p>
        <button onClick={() => router.push(`/${locale}/welcome`)} className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors">
          {t("startNew")}
        </button>
      </div>
    );
  }

  if (mode === "chat") {
    return (
      <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        <div className="mb-4">
          <button
            onClick={() => setMode("select")}
            className="text-text-dim hover:text-accent text-sm mb-2 inline-flex items-center gap-1 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("back")}
          </button>
          <h1 className="text-xl font-bold text-text">{t("chatTitle")}</h1>
        </div>
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-border p-5">
          <ChatWindow
            strategyCode="AI-S20"
            projectId={project.id}
            context={`课题：${project.topic?.name || project.title}\n当前阶段进度：${JSON.stringify(
              project.phases.map((p) => ({
                name: p.name,
                status: p.status,
                taskCount: p.tasks.length,
                completed: p.tasks.filter((tk) => tk.status === "completed" || tk.status === "graded").length,
              }))
            )}`}
            initialMessages={[
              {
                role: "assistant",
                content: t("initialMsg"),
              },
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-lg">⚙️</div>
        <div>
          <h1 className="text-2xl font-bold text-text">{t("title")}</h1>
          <p className="text-sm text-text-dim">{t("subtitle")}</p>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => setMode("chat")}
          className="w-full bg-white rounded-2xl border border-border p-6 text-left hover:border-amber hover:shadow-md hover:shadow-amber/5 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center text-2xl">
              📅
            </div>
            <div className="flex-1">
              <h3 className="font-bold group-hover:text-amber transition-colors text-text">{t("option1Title")}</h3>
              <p className="text-sm text-text-dim mt-1">
                {t("option1Desc")}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted mt-1 group-hover:text-amber transition-colors">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        <button
          onClick={() => setMode("chat")}
          className="w-full bg-white rounded-2xl border border-border p-6 text-left hover:border-cyan hover:shadow-md hover:shadow-cyan/5 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center text-2xl">
              🔧
            </div>
            <div className="flex-1">
              <h3 className="font-bold group-hover:text-cyan transition-colors text-text">{t("option2Title")}</h3>
              <p className="text-sm text-text-dim mt-1">
                {t("option2Desc")}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted mt-1 group-hover:text-cyan transition-colors">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        <button
          onClick={() => router.push(`/${locale}/welcome`)}
          className="w-full bg-white rounded-2xl border border-rose/20 p-6 text-left hover:border-rose hover:shadow-md hover:shadow-rose/5 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose/10 flex items-center justify-center text-2xl">
              🔄
            </div>
            <div className="flex-1">
              <h3 className="font-bold group-hover:text-rose transition-colors text-text">{t("option3Title")}</h3>
              <p className="text-sm text-text-dim mt-1">
                {t("option3Desc")}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted mt-1 group-hover:text-rose transition-colors">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
