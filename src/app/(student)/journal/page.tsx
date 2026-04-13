"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  source: string;
  weekNumber: number | null;
  createdAt: string;
}

const sourceConfig: Record<string, { label: string; color: string; bg: string }> = {
  task_complete: { label: "任务完成", color: "text-green", bg: "bg-green/10" },
  phase_complete: { label: "阶段完成", color: "text-cyan", bg: "bg-cyan/10" },
  plan_adjust: { label: "计划调整", color: "text-amber", bg: "bg-amber/10" },
  topic_confirm: { label: "课题确定", color: "text-purple", bg: "bg-purple/10" },
  project_complete: { label: "项目完结", color: "text-rose", bg: "bg-rose/10" },
};

export default function JournalPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJournal() {
      const res = await fetch("/api/journal");
      const data = await res.json();
      setEntries(data);
      setLoading(false);
    }
    fetchJournal();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-lg">📔</div>
        <div>
          <h1 className="text-2xl font-bold text-text">科研日志</h1>
          <p className="text-sm text-text-dim">
            系统自动记录你的研究历程，以第一人称视角描述你的成长
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center text-3xl mx-auto mb-4">📔</div>
          <p className="text-text-dim mb-2">还没有日志记录</p>
          <p className="text-text-muted text-sm">
            当你完成任务、提交产出或调整计划时，系统会自动生成日志
          </p>
        </div>
      ) : (
        <div className="relative pl-8">
          {/* Timeline vertical line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-accent via-cyan to-green" />

          <div className="space-y-4">
            {entries.map((entry) => {
              const source = sourceConfig[entry.source] || {
                label: entry.source,
                color: "text-text-muted",
                bg: "bg-surface2",
              };
              return (
                <div key={entry.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-8 top-6 w-4 h-4 rounded-full bg-accent border-4 border-bg z-10" />

                  <button
                    onClick={() => router.push(`/journal/${entry.id}`)}
                    className="w-full text-left bg-white rounded-2xl border border-border p-5 hover:border-accent hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${source.bg} ${source.color}`}>
                        {source.label}
                      </span>
                      {entry.weekNumber && (
                        <span className="text-xs text-text-muted">第{entry.weekNumber}周</span>
                      )}
                      <span className="text-xs text-text-muted ml-auto">
                        {new Date(entry.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <h3 className="font-bold mb-1 text-text">{entry.title}</h3>
                    <p className="text-sm text-text-dim line-clamp-3 leading-relaxed">
                      {entry.content}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
