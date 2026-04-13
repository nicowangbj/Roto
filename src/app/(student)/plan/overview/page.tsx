"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  topic: { name: string; description: string | null; field: string | null } | null;
  duration: string | null;
  outputFormat: string | null;
  weeklyHours: string | null;
  phases: Phase[];
}

const PHASE_COLORS = ["#6366f1", "#06b6d4", "#22c55e", "#f59e0b", "#f43f5e", "#a855f7"];
const PHASE_ICONS = ["📖", "🔍", "🧪", "📊", "✍️", "🎯"];

function OverviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

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
        <p className="text-text-dim">加载项目架构...</p>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-20 text-text-dim">未找到项目</div>;
  }

  const totalWeeks = project.phases.length > 0
    ? Math.max(...project.phases.map((p) => p.endWeek || 0))
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Topic summary card */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden mb-8">
        <div className="h-2 bg-gradient-to-r from-accent via-purple to-cyan" />
        <div className="p-6 lg:p-8">
          <div className="flex items-start gap-5">
            <div className="img-placeholder shrink-0" style={{ width: 80, height: 80, borderRadius: "16px" }}>
              <span className="icon">🔬</span>
              <span className="spec">课题封面图 · 80x80</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-text mb-2">{project.topic?.name || project.title}</h1>
              <p className="text-sm text-text-dim leading-relaxed mb-4">
                {project.topic?.description || "AI 导师已为你的课题拆解了完整的研究计划，包含各阶段目标和具体任务。"}
              </p>
              <div className="flex flex-wrap gap-3">
                {project.topic?.field && (
                  <span className="px-3 py-1 bg-purple/10 text-purple text-xs font-medium rounded-full">
                    {project.topic.field}
                  </span>
                )}
                <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                  {totalWeeks > 0 ? `${totalWeeks} 周` : project.duration || "12 周"}
                </span>
                <span className="px-3 py-1 bg-cyan/10 text-cyan text-xs font-medium rounded-full">
                  {project.outputFormat || "研究报告"}
                </span>
                <span className="px-3 py-1 bg-amber/10 text-amber text-xs font-medium rounded-full">
                  {project.weeklyHours || "每周5小时"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI tutor interpretation */}
      <div className="bg-accent/5 rounded-2xl p-5 mb-8 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
          <span className="text-lg">🧑‍🔬</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-accent mb-1">导师解读</h3>
          <p className="text-sm text-text-dim leading-relaxed">
            我将你的研究课题拆分成了 {project.phases.length} 个阶段。每个阶段都有明确的目标和产出要求，从基础的文献调研开始，逐步深入到数据收集、分析和最终的报告撰写。按照计划推进，你可以在
            {totalWeeks > 0 ? ` ${totalWeeks} 周` : "预定时间"}内完成整个研究。
          </p>
        </div>
      </div>

      {/* Phase timeline */}
      <h2 className="text-lg font-bold text-text mb-5">研究阶段</h2>
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
                        第 {phase.startWeek}-{phase.endWeek} 周
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
                      <span className="font-semibold">阶段目标：</span>{phase.goal}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall overview stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-accent">{project.phases.length}</p>
          <p className="text-xs text-text-muted mt-1">研究阶段</p>
        </div>
        <div className="stat-card p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-cyan">{totalWeeks || "—"}</p>
          <p className="text-xs text-text-muted mt-1">总计周数</p>
        </div>
        <div className="stat-card p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-green">{project.outputFormat || "报告"}</p>
          <p className="text-xs text-text-muted mt-1">最终产出</p>
        </div>
      </div>

      <button
        onClick={() => router.push(`/plan/detail?projectId=${project.id}`)}
        className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
      >
        查看详细计划
      </button>
    </div>
  );
}

export default function PlanOverviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <OverviewContent />
    </Suspense>
  );
}
