"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  goal: string | null;
  startWeek: number | null;
  endWeek: number | null;
  tasks: Task[];
}

const PHASE_COLORS = ["#6366f1", "#06b6d4", "#22c55e", "#f59e0b", "#f43f5e", "#a855f7"];

function PhaseContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const phaseId = params.phaseId as string;
  const projectId = searchParams.get("projectId");
  const [phase, setPhase] = useState<Phase | null>(null);
  const [topicName, setTopicName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    async function fetchPhase() {
      const res = await fetch("/api/projects");
      const projects = await res.json();
      for (const p of projects) {
        const found = p.phases.find((ph: Phase) => ph.id === phaseId);
        if (found) {
          setPhase(found);
          setTopicName(p.topic?.name || "");
          break;
        }
      }
      setLoading(false);
    }
    fetchPhase();
  }, [phaseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!phase) return <div className="text-center py-20 text-text-dim">阶段未找到</div>;

  const color = PHASE_COLORS[(phase.order - 1) % PHASE_COLORS.length];
  const completedCount = phase.tasks.filter((t) => t.status === "completed" || t.status === "graded").length;
  const progress = phase.tasks.length > 0 ? Math.round((completedCount / phase.tasks.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.push(`/map?projectId=${projectId}`)}
        className="text-text-dim hover:text-accent text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        返回科研地图
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Phase header */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden mb-8">
            <div className="h-1.5" style={{ background: color }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg text-white" style={{ background: color }}>
                  阶段 {phase.order}
                </span>
                <span className="text-xs text-text-muted bg-surface2 px-2.5 py-1 rounded-full">
                  第 {phase.startWeek}-{phase.endWeek} 周
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-text">{phase.name}</h1>
              {phase.description && <p className="text-text-dim mb-3">{phase.description}</p>}
              {phase.goal && (
                <div className="bg-surface2 rounded-xl p-3 mt-3">
                  <span className="text-xs font-semibold text-text-muted">目标</span>
                  <p className="text-sm text-text mt-0.5">{phase.goal}</p>
                </div>
              )}

              {/* Progress */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-2 bg-surface2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: color }} />
                </div>
                <span className="text-sm font-medium" style={{ color }}>{completedCount}/{phase.tasks.length}</span>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4 text-text">本阶段任务</h2>
          <div className="space-y-3">
            {phase.tasks.map((task) => {
              const isLocked = task.status === "locked";
              const isActive = task.status === "active";
              const isDone = task.status === "completed" || task.status === "graded";

              return (
                <button
                  key={task.id}
                  onClick={() => {
                    if (!isLocked) {
                      router.push(`/task/${task.id}?projectId=${projectId}`);
                    }
                  }}
                  disabled={isLocked}
                  className={`w-full text-left bg-white rounded-2xl border p-5 transition-all ${
                    isLocked
                      ? "opacity-40 cursor-not-allowed border-border"
                      : isActive
                      ? "border-accent shadow-md shadow-accent/10 hover:shadow-lg cursor-pointer"
                      : isDone
                      ? "border-green/30 cursor-pointer hover:shadow-sm"
                      : "border-border hover:border-accent hover:shadow-sm cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                        isDone
                          ? "bg-green/10 text-green"
                          : isActive
                          ? "bg-accent/10 text-accent"
                          : "bg-surface2 text-text-muted"
                      }`}
                    >
                      {isDone ? "✓" : task.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-text-dim mt-0.5 truncate">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isActive && (
                        <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">进行中</span>
                      )}
                      {isDone && (
                        <span className="px-2.5 py-1 bg-green/10 text-green text-xs font-medium rounded-full">已完成</span>
                      )}
                      {isLocked && (
                        <span className="text-xs text-text-muted">🔒</span>
                      )}
                      {!isLocked && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted">
                          <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Tutor sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-border p-4 sticky top-24">
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full flex items-center gap-3 mb-4"
            >
              <RotaAvatar size="xxs" />
              <div className="text-left flex-1">
                <p className="font-semibold text-sm text-text">Rota 导师</p>
                <p className="text-xs text-text-dim">有问题随时问我</p>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                className={`text-text-muted transition-transform ${showChat ? "rotate-90" : ""}`}
              >
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showChat && (
              <div className="h-96 border-t border-border pt-4">
                <ChatWindow
                  strategyCode="AI-S13"
                  projectId={projectId || undefined}
                  context={`当前阶段：${phase.name}\n阶段描述：${phase.description || ""}\n阶段目标：${phase.goal || ""}\n课题：${topicName}`}
                  placeholder="关于这个阶段，问我..."
                  initialMessages={[
                    {
                      role: "assistant",
                      content: `你正在进行「${phase.name}」阶段。这个阶段的目标是${phase.goal || "完成相关任务"}。有什么疑问吗？我可以帮你理清思路！`,
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

export default function PhasePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <PhaseContent />
    </Suspense>
  );
}
