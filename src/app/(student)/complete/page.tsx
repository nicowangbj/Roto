"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  title: string;
  topic: { name: string } | null;
  phases: { name: string; tasks: { status: string }[] }[];
}

export default function CompletePage() {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchProject() {
      const res = await fetch("/api/projects");
      const projects = await res.json();
      setProject(projects[0] || null);
    }
    fetchProject();
  }, []);

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
        <h1 className="text-3xl font-extrabold mb-3 text-text">恭喜完成研究项目！</h1>
        <p className="text-text-dim text-lg">
          {project?.topic?.name || "你的研究课题"}
        </p>
      </div>

      {/* Achievement placeholder */}
      <div className="mb-8">
        <div className="img-placeholder mx-auto" style={{ width: 300, height: 100 }}>
          <span className="spec">完成勋章/证书装饰 · 300x100 · 成就感视觉</span>
        </div>
      </div>

      {/* Research summary */}
      <div className="bg-white rounded-2xl border border-border p-8 mb-8 text-left">
        <h2 className="text-lg font-bold mb-5 text-center text-text">研究成果总结</h2>
        {project?.phases.map((phase, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
            <div className="w-7 h-7 rounded-lg bg-green/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7L6 10L11 4" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-text-dim flex-1">{phase.name}</span>
            <span className="text-xs text-text-muted bg-surface2 px-2.5 py-1 rounded-full">
              {phase.tasks.filter((t) => t.status === "completed" || t.status === "graded").length}/{phase.tasks.length} 任务
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => router.push("/journal")}
          className="px-8 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
        >
          查看完整科研日志
        </button>
        <button
          onClick={() => router.push("/welcome")}
          className="px-8 py-3.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
        >
          开始新的研究
        </button>
      </div>
    </div>
  );
}
