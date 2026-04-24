"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import ChatWindow from "@/components/ChatWindow";
import RotoAvatar from "@/components/RotoAvatar";

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  explanation: string | null;
  status: string;
  phase: { name: string; project: { id: string; topic: { name: string } | null } };
}

function TaskContent() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const taskId = params.taskId as string;
  const projectId = searchParams.get("projectId");
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [content, setContent] = useState("");
  const t = useTranslations("task");
  const tCommon = useTranslations("common");

  useEffect(() => {
    async function fetchTask() {
      const res = await fetch("/api/projects");
      const projects = await res.json();
      for (const p of projects) {
        for (const phase of p.phases) {
          const found = phase.tasks.find((t: { id: string }) => t.id === taskId);
          if (found) {
            setTask({
              ...found,
              phase: { name: phase.name, project: { id: p.id, topic: p.topic } },
            });
            break;
          }
        }
      }
      setLoading(false);
    }
    fetchTask();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) return <div className="text-center py-20 text-text-dim">{t("notFound")}</div>;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    router.push(
      `/${locale}/task/${taskId}/submit?projectId=${projectId}&content=${encodeURIComponent(content)}`
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-text-dim hover:text-accent text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("back")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <span className="text-xs text-text-muted bg-surface2 px-2.5 py-1 rounded-full">{task.phase.name}</span>
            <h1 className="text-2xl font-bold mt-2 text-text">{task.title}</h1>
            {task.description && (
              <p className="text-text-dim mt-2 leading-relaxed">{task.description}</p>
            )}
          </div>

          {/* Task explanation link */}
          <button
            onClick={() => router.push(`/${locale}/task/${taskId}/explain?projectId=${projectId}`)}
            className="w-full mb-6 bg-white rounded-2xl border border-border p-4 text-left hover:border-accent hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-lg">📖</div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-text">{t("explainBtn")}</p>
                <p className="text-xs text-text-dim">{t("explainHint")}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted group-hover:text-accent transition-colors">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>

          {/* Submission area */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-bold mb-4 text-text">{t("submitTitle")}</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text placeholder-text-muted font-mono resize-y focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
              placeholder={t("submitPlaceholder")}
            />
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="mt-4 px-8 py-3 bg-green hover:bg-green/90 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-green/20"
            >
              {t("submitBtn")}
            </button>
          </div>
        </div>

        {/* AI Tutor sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-border p-4 sticky top-24">
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full flex items-center gap-3 mb-4"
            >
              <RotoAvatar size="xxs" />
              <div className="text-left flex-1">
                <p className="font-semibold text-sm text-text">{tCommon("rotaMentor")}</p>
                <p className="text-xs text-text-dim">{t("chatTitle")}</p>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                className={`text-text-muted transition-transform ${showChat ? "rotate-90" : ""}`}
              >
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showChat && (
              <div className="h-80 border-t border-border pt-4">
                <ChatWindow
                  strategyCode="AI-S13"
                  projectId={task.phase.project.id}
                  context={`当前任务：${task.title}\n任务描述：${task.description || ""}\n课题：${task.phase.project.topic?.name || ""}`}
                  placeholder={t("placeholder")}
                  initialMessages={[
                    {
                      role: "assistant",
                      content: t("initialMsg", { taskTitle: task.title }),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <TaskContent />
    </Suspense>
  );
}
