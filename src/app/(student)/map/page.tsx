"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RotaAvatar from "@/components/RotaAvatar";

interface Task {
  id: string;
  order: number;
  title: string;
  status: string;
  weekNumber: number | null;
}

interface Phase {
  id: string;
  order: number;
  name: string;
  description: string | null;
  goal: string | null;
  status: string;
  startWeek: number | null;
  endWeek: number | null;
  tasks: Task[];
}

interface Project {
  id: string;
  title: string;
  status: string;
  topic: { name: string } | null;
  phases: Phase[];
}

const PHASE_THEMES = [
  { main: "#6366f1", light: "#eef2ff", gradient: "from-indigo-500 to-purple-500", icon: "📖", label: "文献研读" },
  { main: "#06b6d4", light: "#ecfeff", gradient: "from-cyan-500 to-blue-500", icon: "🔍", label: "方法探索" },
  { main: "#22c55e", light: "#f0fdf4", gradient: "from-green-500 to-emerald-500", icon: "🧪", label: "实验研究" },
  { main: "#f59e0b", light: "#fffbeb", gradient: "from-amber-500 to-orange-500", icon: "📊", label: "数据分析" },
  { main: "#f43f5e", light: "#fff1f2", gradient: "from-rose-500 to-pink-500", icon: "✍️", label: "论文撰写" },
  { main: "#a855f7", light: "#faf5ff", gradient: "from-purple-500 to-violet-500", icon: "🎯", label: "成果总结" },
];

const DEFAULT_PROJECT: Project = {
  id: "demo-1",
  title: "社交媒体对高中生学习动机的影响研究",
  status: "active",
  topic: { name: "社交媒体对高中生学习动机的影响研究" },
  phases: [
    {
      id: "p1", order: 1, name: "文献调研", description: "阅读相关领域文献，建立理论基础",
      goal: "完成文献综述框架", status: "completed", startWeek: 1, endWeek: 2,
      tasks: [
        { id: "t1", order: 1, title: "搜索核心文献（不少于10篇）", status: "completed", weekNumber: 1 },
        { id: "t2", order: 2, title: "撰写文献阅读笔记", status: "completed", weekNumber: 1 },
        { id: "t3", order: 3, title: "整理文献综述大纲", status: "completed", weekNumber: 2 },
      ],
    },
    {
      id: "p2", order: 2, name: "研究设计", description: "设计研究方案，确定研究方法",
      goal: "完成研究计划书", status: "active", startWeek: 3, endWeek: 4,
      tasks: [
        { id: "t4", order: 1, title: "确定研究问题与假设", status: "completed", weekNumber: 3 },
        { id: "t5", order: 2, title: "设计问卷/访谈提纲", status: "active", weekNumber: 3 },
        { id: "t6", order: 3, title: "撰写研究计划书", status: "locked", weekNumber: 4 },
      ],
    },
    {
      id: "p3", order: 3, name: "数据收集", description: "实施调研，收集一手数据",
      goal: "获取有效样本数据", status: "locked", startWeek: 5, endWeek: 7,
      tasks: [
        { id: "t7", order: 1, title: "预测试与问卷优化", status: "locked", weekNumber: 5 },
        { id: "t8", order: 2, title: "正式发放问卷", status: "locked", weekNumber: 6 },
        { id: "t9", order: 3, title: "数据清洗与整理", status: "locked", weekNumber: 7 },
      ],
    },
    {
      id: "p4", order: 4, name: "数据分析", description: "运用统计方法分析数据",
      goal: "得出研究结论", status: "locked", startWeek: 8, endWeek: 9,
      tasks: [
        { id: "t10", order: 1, title: "描述性统计分析", status: "locked", weekNumber: 8 },
        { id: "t11", order: 2, title: "相关性与回归分析", status: "locked", weekNumber: 9 },
      ],
    },
    {
      id: "p5", order: 5, name: "报告撰写", description: "整合研究成果，撰写最终报告",
      goal: "完成研究报告终稿", status: "locked", startWeek: 10, endWeek: 12,
      tasks: [
        { id: "t12", order: 1, title: "撰写报告初稿", status: "locked", weekNumber: 10 },
        { id: "t13", order: 2, title: "导师修改与完善", status: "locked", weekNumber: 11 },
        { id: "t14", order: 3, title: "定稿与提交", status: "locked", weekNumber: 12 },
      ],
    },
  ],
};

function MapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [project, setProject] = useState<Project>(DEFAULT_PROJECT);
  const [loading, setLoading] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [hoveredIsland, setHoveredIsland] = useState<number | null>(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch("/api/projects");
        const projects = await res.json();
        if (Array.isArray(projects) && projects.length > 0) {
          const p = projects.find((p: Project) => p.id === projectId) || projects[0];
          setProject(p);
        }
      } catch {
        // keep default project
      }
      setLoading(false);
    }
    fetchProject();
  }, [projectId]);

  // Find active phase
  const activePhase = project.phases.find((p) => p.status === "active") || project.phases[0];
  const activePhaseIndex = project.phases.indexOf(activePhase);

  const effectiveSelectedPhaseId = selectedPhase ?? activePhase?.id ?? null;
  const selectedPhaseData = project.phases.find(
    (p) => p.id === effectiveSelectedPhaseId
  );

  const totalTasks = project.phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = project.phases.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === "completed" || t.status === "graded").length,
    0
  );
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalWeeks = project.phases.length > 0
    ? Math.max(...project.phases.map((p) => p.endWeek || 0))
    : 0;

  // Current week estimation based on progress
  const currentWeek = activePhase?.startWeek || 1;

  const handlePhaseClick = (phase: Phase) => {
    setSelectedPhase(phase.id);

    if (phase.status !== "locked") {
      router.push(`/phase/${phase.id}?projectId=${project.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-text-dim">加载科研地图...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 max-w-[1300px] mx-auto">
      {/* Left: Main Map Area */}
      <div className="flex-1 min-w-0">
        {/* Map Header */}
        <div className="bg-white rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-purple flex items-center justify-center text-white text-xl shadow-lg shadow-accent/20">
                🗺️
              </div>
              <div>
                <h1 className="text-xl font-bold text-text">{project.topic?.name || project.title}</h1>
                <p className="text-sm text-text-dim">
                  第 {currentWeek}/{totalWeeks} 周 · 已完成 {completedTasks}/{totalTasks} 个任务
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/journal?projectId=${project.id}`)}
                className="px-3.5 py-2 bg-surface2 hover:bg-accent/10 text-text-dim hover:text-accent text-sm font-medium rounded-xl transition-colors"
              >
                📔 科研日志
              </button>
              <button
                onClick={() => router.push(`/adjust?projectId=${project.id}`)}
                className="px-3.5 py-2 bg-surface2 hover:bg-accent/10 text-text-dim hover:text-accent text-sm font-medium rounded-xl transition-colors"
              >
                ⚙️ 调整计划
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent via-cyan to-green rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-bold text-accent min-w-[40px] text-right">{progress}%</span>
          </div>
        </div>

        {/* Game Map - Winding Path */}
        <div className="relative bg-gradient-to-b from-blue-50/50 via-green-50/30 to-amber-50/30 rounded-2xl border border-border p-8 min-h-[600px] overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-6 right-8 opacity-20">
            <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
              <path d="M10 70 Q30 20 60 40 Q90 60 110 20" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>
          <div className="absolute bottom-10 left-6 opacity-15">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="35" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="6 4" />
              <circle cx="40" cy="40" r="20" stroke="#22c55e" strokeWidth="1" strokeDasharray="3 3" />
            </svg>
          </div>

          {/* Winding path SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>

          {/* Phase Nodes on the path */}
          <div className="relative space-y-3">
            {project.phases.map((phase, i) => {
              const theme = PHASE_THEMES[i % PHASE_THEMES.length];
              const isLocked = phase.status === "locked";
              const isCompleted = phase.status === "completed";
              const isActive = phase.status === "active";
              const isSelected = effectiveSelectedPhaseId === phase.id;
              const tasksDone = phase.tasks.filter((t) => t.status === "completed" || t.status === "graded").length;
              const taskProgress = phase.tasks.length > 0 ? Math.round((tasksDone / phase.tasks.length) * 100) : 0;

              // Zigzag layout
              const isLeft = i % 2 === 0;

              return (
                <div key={phase.id}>
                  {/* Connector path segment */}
                  {i > 0 && (
                    <div className="flex justify-center py-1">
                      <svg width="200" height="40" viewBox="0 0 200 40" fill="none" className="opacity-40">
                        {isLeft ? (
                          <path d="M140 0 C140 20 60 20 60 40" stroke={theme.main} strokeWidth="3" strokeDasharray={isLocked ? "6 4" : "0"} />
                        ) : (
                          <path d="M60 0 C60 20 140 20 140 40" stroke={theme.main} strokeWidth="3" strokeDasharray={isLocked ? "6 4" : "0"} />
                        )}
                      </svg>
                    </div>
                  )}

                  {/* Phase node with landmark */}
                  <div className={`flex items-start gap-4 ${isLeft ? "mr-auto pr-12" : "ml-auto pl-12"}`} style={{ maxWidth: "75%" }}>
                    {/* Landmark icon */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-all duration-300 ${
                        isLocked
                          ? "bg-surface2 grayscale opacity-50"
                          : isActive
                          ? "shadow-xl animate-bounce"
                          : isCompleted
                          ? "shadow-md"
                          : "shadow-sm"
                      } ${isLeft ? "order-1" : "order-2"}`}
                      style={{
                        background: isLocked ? undefined : theme.light,
                        boxShadow: isActive ? `0 8px 24px ${theme.main}30` : undefined,
                      }}
                    >
                      <span className={isLocked ? "opacity-50" : ""}>{theme.icon}</span>
                      {/* Active indicator ring */}
                      {isActive && (
                        <div
                          className="absolute w-16 h-16 rounded-2xl animate-ping opacity-20"
                          style={{ background: theme.main }}
                        />
                      )}
                    </div>

                    {/* Phase card */}
                    <button
                      onClick={() => {
                        handlePhaseClick(phase);
                      }}
                      className={`flex-1 text-left rounded-2xl p-4 transition-all duration-200 border-2 ${
                        isLeft ? "order-2" : "order-1"
                      } ${
                        isSelected
                          ? "bg-white shadow-lg"
                          : isLocked
                          ? "bg-surface2/50 cursor-default"
                          : "bg-white hover:shadow-md cursor-pointer"
                      }`}
                      style={{
                        borderColor: isSelected ? theme.main : isLocked ? "transparent" : `${theme.main}30`,
                        boxShadow: isSelected ? `0 4px 20px ${theme.main}15` : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
                          style={{ background: isLocked ? "#94a3b8" : theme.main }}
                        >
                          阶段 {phase.order}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          第{phase.startWeek}-{phase.endWeek}周
                        </span>
                        {/* Status */}
                        {isCompleted && (
                          <span className="text-[10px] font-semibold text-green bg-green/10 px-1.5 py-0.5 rounded-md ml-auto">
                            已完成
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-md ml-auto flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                            进行中
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-[10px] text-text-muted ml-auto">🔒 未解锁</span>
                        )}
                      </div>

                      <h3 className={`font-bold text-sm mb-1 ${isLocked ? "text-text-muted" : "text-text"}`}>
                        {phase.name}
                      </h3>

                      {phase.goal && (
                        <p className={`text-xs mb-2.5 line-clamp-1 ${isLocked ? "text-text-muted/60" : "text-text-dim"}`}>
                          {phase.goal}
                        </p>
                      )}

                      {/* Task progress */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${theme.main}15` }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${taskProgress}%`, background: theme.main }}
                          />
                        </div>
                        <span className="text-[11px] text-text-muted font-medium">
                          {tasksDone}/{phase.tasks.length}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Finish node */}
            <div className="flex justify-center pt-4">
              <svg width="200" height="30" viewBox="0 0 200 30" fill="none" className="opacity-30">
                <path d="M100 0 L100 30" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>
            <div className="flex justify-center">
              <div
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
                  progress === 100
                    ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 shadow-lg shadow-amber-200/50"
                    : "bg-surface2/50 border-border"
                }`}
              >
                <span className="text-3xl">{progress === 100 ? "🏆" : "🎯"}</span>
                <span className={`text-[10px] font-semibold mt-0.5 ${progress === 100 ? "text-amber-600" : "text-text-muted"}`}>
                  {progress === 100 ? "完成!" : "终点"}
                </span>
              </div>
            </div>
          </div>

          {/* Character on the path */}
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-700 pointer-events-none z-10"
            style={{ top: `${Math.max(8, (activePhaseIndex / Math.max(project.phases.length - 1, 1)) * 70 + 8)}%` }}
          >
            <div className="img-placeholder" style={{ width: 48, height: 48, borderRadius: "50%" }}>
              <span className="icon">🧑‍🎓</span>
              <span className="spec">学生角色头像 · 48x48</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Island Overview + Task Panel */}
      <div className="w-[340px] shrink-0 space-y-5">
        {/* Island Map - Phase Overview */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-accent via-purple to-cyan" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-text">研究岛屿总览</h2>
              <span className="text-xs text-text-muted">{project.phases.length} 个阶段</span>
            </div>

            {/* Island-style visual map */}
            <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 mb-4" style={{ minHeight: 200 }}>
              {/* Water/background pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 300 200">
                <path d="M0 180 Q75 170 150 180 Q225 190 300 175" stroke="#06b6d4" strokeWidth="1.5" fill="none" />
                <path d="M0 190 Q75 185 150 193 Q225 200 300 188" stroke="#06b6d4" strokeWidth="1" fill="none" />
              </svg>

              {/* Islands */}
              <div className="relative grid grid-cols-3 gap-3">
                {project.phases.map((phase, i) => {
                  const theme = PHASE_THEMES[i % PHASE_THEMES.length];
                  const isLocked = phase.status === "locked";
                  const isCompleted = phase.status === "completed";
                  const isActive = phase.status === "active";
                  const isSelected = effectiveSelectedPhaseId === phase.id;

                  return (
                    <button
                      key={phase.id}
                      onClick={() => handlePhaseClick(phase)}
                      onMouseEnter={() => setHoveredIsland(i)}
                      onMouseLeave={() => setHoveredIsland(null)}
                      className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
                        isSelected
                          ? "bg-white shadow-md scale-105"
                          : hoveredIsland === i
                          ? "bg-white/80 shadow-sm"
                          : "bg-white/40"
                      } ${isLocked ? "opacity-50" : ""}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-1 ${
                          isActive ? "animate-bounce" : ""
                        }`}
                        style={{
                          background: isLocked ? "#e2e8f0" : theme.light,
                          boxShadow: isActive ? `0 2px 8px ${theme.main}30` : "none",
                        }}
                      >
                        {isCompleted ? (
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="9" r="8" fill="#22c55e" />
                            <path d="M5 9L8 12L13 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : isLocked ? (
                          <span className="text-sm">🔒</span>
                        ) : (
                          <span>{theme.icon}</span>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-tight ${
                        isLocked ? "text-text-muted" : "text-text-dim"
                      }`}>
                        {phase.name.length > 4 ? phase.name.slice(0, 4) : phase.name}
                      </span>
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full shadow-sm">
                          <span className="absolute inset-0 bg-accent rounded-full animate-ping opacity-40" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tutor greeting */}
              <div className="mt-3 flex items-start gap-2">
                <div className="shrink-0">
                  <RotaAvatar size="xxs" />
                </div>
                <div className="bg-white/80 rounded-lg rounded-tl-sm px-3 py-2">
                  <p className="text-[11px] text-text-dim leading-relaxed">
                    {activePhase?.status === "active"
                      ? `你正在「${activePhase.name}」阶段，继续加油！`
                      : "欢迎来到科研地图！点击岛屿查看任务详情。"}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-accent/5 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-accent">{completedTasks}</p>
                <p className="text-[10px] text-text-muted">已完成</p>
              </div>
              <div className="bg-cyan/5 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-cyan">{totalTasks - completedTasks}</p>
                <p className="text-[10px] text-text-muted">待完成</p>
              </div>
              <div className="bg-green/5 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-green">第{currentWeek}周</p>
                <p className="text-[10px] text-text-muted">当前</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Phase - Task Details */}
        {selectedPhaseData && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div
              className="h-1.5"
              style={{ background: PHASE_THEMES[project.phases.indexOf(selectedPhaseData) % PHASE_THEMES.length].main }}
            />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{
                    background: PHASE_THEMES[project.phases.indexOf(selectedPhaseData) % PHASE_THEMES.length].light,
                  }}
                >
                  {PHASE_THEMES[project.phases.indexOf(selectedPhaseData) % PHASE_THEMES.length].icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-text">{selectedPhaseData.name}</h3>
                  <p className="text-[11px] text-text-muted">
                    第{selectedPhaseData.startWeek}-{selectedPhaseData.endWeek}周 · {selectedPhaseData.tasks.length}个任务
                  </p>
                </div>
              </div>

              {selectedPhaseData.goal && (
                <div
                  className="px-3 py-2 rounded-xl mb-4 text-xs"
                  style={{
                    background: `${PHASE_THEMES[project.phases.indexOf(selectedPhaseData) % PHASE_THEMES.length].main}08`,
                    color: PHASE_THEMES[project.phases.indexOf(selectedPhaseData) % PHASE_THEMES.length].main,
                  }}
                >
                  <span className="font-semibold">目标：</span>{selectedPhaseData.goal}
                </div>
              )}

              {/* Task list */}
              <div className="space-y-2">
                {selectedPhaseData.tasks.map((task) => {
                  const isDone = task.status === "completed" || task.status === "graded";
                  const isTaskActive = task.status === "active";
                  const isTaskLocked = task.status === "locked";
                  const phaseTheme = PHASE_THEMES[project.phases.indexOf(selectedPhaseData) % PHASE_THEMES.length];

                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        if (!isTaskLocked) {
                          router.push(`/task/${task.id}?projectId=${project.id}`);
                        }
                      }}
                      disabled={isTaskLocked}
                      className={`w-full flex items-center gap-3 text-left p-3 rounded-xl transition-all ${
                        isTaskActive
                          ? "bg-accent/5 border border-accent/20 shadow-sm"
                          : isDone
                          ? "bg-green/5 border border-green/10"
                          : "bg-surface2/50 border border-transparent"
                      } ${isTaskLocked ? "opacity-50 cursor-not-allowed" : "hover:shadow-sm cursor-pointer"}`}
                    >
                      {/* Status icon */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isDone
                            ? "bg-green text-white"
                            : isTaskActive
                            ? "text-white"
                            : "bg-surface2 text-text-muted"
                        }`}
                        style={{
                          background: isTaskActive ? phaseTheme.main : undefined,
                        }}
                      >
                        {isDone ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : isTaskActive ? (
                          <span className="w-2 h-2 bg-white rounded-full" />
                        ) : (
                          task.order
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-tight ${
                          isTaskLocked ? "text-text-muted" : "text-text-dim"
                        }`}>
                          {task.title}
                        </p>
                        {task.weekNumber && (
                          <p className="text-[10px] text-text-muted mt-0.5">第{task.weekNumber}周</p>
                        )}
                      </div>

                      {/* Arrow for active/completed */}
                      {!isTaskLocked && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-text-muted shrink-0">
                          <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Enter phase button */}
              {selectedPhaseData.status !== "locked" && (
                <button
                  onClick={() => router.push(`/phase/${selectedPhaseData.id}?projectId=${project.id}`)}
                  className="w-full mt-4 py-2.5 text-sm font-semibold rounded-xl transition-colors text-white"
                  style={{
                    background: PHASE_THEMES[project.phases.indexOf(selectedPhaseData) % PHASE_THEMES.length].main,
                  }}
                >
                  进入阶段详情
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <MapContent />
    </Suspense>
  );
}
