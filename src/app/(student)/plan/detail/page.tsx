"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import RotaAvatar from "@/components/RotaAvatar";

interface Task {
  id: string;
  order: number;
  title: string;
  description: string | null;
  weekNumber: number | null;
  status: string;
}

interface Phase {
  id: string;
  order: number;
  name: string;
  description: string | null;
  startWeek: number | null;
  endWeek: number | null;
  tasks: Task[];
}

interface Project {
  id: string;
  title: string;
  topic: { name: string } | null;
  phases: Phase[];
}

const PHASE_COLORS = ["#6366f1", "#06b6d4", "#22c55e", "#f59e0b", "#f43f5e", "#a855f7"];

function PlanDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      const res = await fetch("/api/projects");
      const projects = await res.json();
      const p = projects.find((p: Project) => p.id === projectId) || projects[0];
      setProject(p);
      setLoading(false);
    }
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-text-dim">加载计划详情...</p>
      </div>
    );
  }

  if (!project) return null;

  const planSummary = project.phases
    .map((p) => `阶段${p.order}「${p.name}」(第${p.startWeek}-${p.endWeek}周): ${p.tasks.map((t) => t.title).join("、")}`)
    .join("\n");

  return (
    <div className="flex gap-6 max-w-[1200px] mx-auto">
      {/* Left: Plan detail */}
      <div className={`flex-1 min-w-0 ${showChat ? "max-w-[60%]" : ""}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text">总计划详情</h1>
            <p className="text-text-dim">{project.topic?.name || project.title}</p>
          </div>
          {!showChat && (
            <button
              onClick={() => setShowChat(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 hover:bg-accent/20 text-accent font-medium rounded-xl transition-colors text-sm"
            >
              <RotaAvatar size="xxs" />
              与导师沟通修改
            </button>
          )}
        </div>

        <div className="space-y-4 mb-8">
          {project.phases.map((phase, idx) => {
            const color = PHASE_COLORS[idx % PHASE_COLORS.length];
            const completedCount = phase.tasks.filter((t) => t.status === "completed" || t.status === "graded").length;
            const progress = phase.tasks.length > 0 ? (completedCount / phase.tasks.length) * 100 : 0;

            return (
              <div key={phase.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="h-1" style={{ background: color }} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                        style={{ background: color }}
                      >
                        阶段 {phase.order}
                      </span>
                      <h3 className="font-bold text-text">{phase.name}</h3>
                    </div>
                    <span className="text-xs text-text-muted bg-surface2 px-2.5 py-1 rounded-full">
                      第 {phase.startWeek}-{phase.endWeek} 周
                    </span>
                  </div>

                  {phase.description && (
                    <p className="text-sm text-text-dim mb-3">{phase.description}</p>
                  )}

                  <div className="w-full h-2 bg-surface2 rounded-full mb-4">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, background: color }}
                    />
                  </div>

                  {phase.tasks.length > 0 && (
                    <div className="space-y-1.5">
                      {phase.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 text-sm py-2 px-3 rounded-xl hover:bg-surface2 transition-colors">
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold ${
                              task.status === "completed" || task.status === "graded"
                                ? "bg-green/10 text-green"
                                : task.status === "active"
                                ? "bg-accent/10 text-accent"
                                : "bg-surface2 text-text-muted"
                            }`}
                          >
                            {(task.status === "completed" || task.status === "graded") ? "✓" : task.order}
                          </div>
                          <span className={task.status === "locked" ? "text-text-muted" : "text-text-dim flex-1"}>
                            {task.title}
                          </span>
                          {task.weekNumber && (
                            <span className="text-xs text-text-muted">
                              第{task.weekNumber}周
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/map?projectId=${project.id}`)}
            className="flex-1 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
          >
            确认计划，进入科研地图
          </button>
          <button
            onClick={() => router.push(`/plan/overview?projectId=${project.id}`)}
            className="px-6 py-3.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
          >
            返回架构
          </button>
        </div>
      </div>

      {/* Right: AI Tutor chat panel */}
      {showChat && (
        <div className="w-[380px] shrink-0 flex flex-col h-[calc(100vh-140px)] sticky top-24">
          <div className="bg-white rounded-2xl border border-border flex flex-col flex-1 overflow-hidden">
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RotaAvatar size="xxs" />
                <div>
                  <h3 className="text-sm font-bold text-text">Rota 导师</h3>
                  <p className="text-xs text-text-muted">沟通计划修改</p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface2 flex items-center justify-center text-text-muted hover:text-text transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Chat body */}
            <div className="flex-1 min-h-0 p-4">
              <ChatWindow
                strategyCode="AI-S20"
                projectId={project.id}
                context={`课题：${project.topic?.name || project.title}\n当前计划：\n${planSummary}`}
                placeholder="告诉导师你想修改的内容..."
                initialMessages={[
                  {
                    role: "assistant",
                    content: `我看到了你的研究计划，一共 ${project.phases.length} 个阶段。\n\n你可以告诉我想要怎么调整，比如：\n• 某个阶段的任务太多/太少\n• 想调整时间安排\n• 想增减某个阶段的内容\n• 对某个任务有疑问\n\n我会帮你优化计划！`,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlanDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <PlanDetailContent />
    </Suspense>
  );
}
