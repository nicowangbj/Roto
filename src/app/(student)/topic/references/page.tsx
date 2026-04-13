"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Reference {
  title: string;
  description: string;
  difficulty: string;
  field: string;
}

const DIFFICULTY_STYLE: Record<string, string> = {
  "入门": "bg-green/10 text-green",
  "中等": "bg-amber/10 text-amber",
  "进阶": "bg-rose/10 text-rose",
};

const DEFAULT_REFERENCES: Reference[] = [
  { title: "青少年社交媒体使用对心理健康的影响", description: "调查不同社交平台使用时间与心理健康指标的相关性", difficulty: "中等", field: "心理学" },
  { title: "校园垃圾分类效果评估", description: "设计实验评估不同宣传方式对学生垃圾分类行为的影响", difficulty: "入门", field: "环境科学" },
  { title: "AI 辅助学习工具的效果分析", description: "对比使用AI学习工具和传统方式的学习效果差异", difficulty: "中等", field: "教育技术" },
  { title: "本地河流水质变化追踪", description: "通过定期采样检测分析河流水质变化趋势及原因", difficulty: "入门", field: "环境科学" },
  { title: "高中生睡眠质量与学业表现关系", description: "通过问卷和成绩数据分析两者的相关性", difficulty: "入门", field: "健康科学" },
  { title: "校园植物多样性调查", description: "记录和分析校园内植物种类及其生态功能", difficulty: "入门", field: "生物学" },
];

function ReferencesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keywords = searchParams.get("keywords") || "";
  const conversationId = searchParams.get("conversationId");
  const [loading, setLoading] = useState(false);
  const [references, setReferences] = useState<Reference[]>(DEFAULT_REFERENCES);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const recommendUrl = conversationId
    ? `/topic/recommend?keywords=${keywords}&refs=${encodeURIComponent([...selected].map((i) => references[i].title).join(","))}&conversationId=${conversationId}`
    : `/topic/recommend?keywords=${keywords}&refs=${encodeURIComponent([...selected].map((i) => references[i].title).join(","))}`;
  const backUrl = conversationId
    ? `/topic/keywords?conversationId=${conversationId}`
    : "/topic/keywords";

  useEffect(() => {
    if (!keywords) return;
    async function fetchReferences() {
      setLoading(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategyCode: "AI-S04",
            input: `用户选择的关键词：${keywords}`,
          }),
        });
        const data = await res.json();
        const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.references) && parsed.references.length > 0) {
            setReferences(parsed.references);
          }
        }
      } catch {
        // keep default references
      }
      setLoading(false);
    }
    fetchReferences();
  }, [keywords]);

  const toggle = (index: number) => {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelected(next);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin mb-4" />
        <p className="text-text-dim">正在搜索相关研究...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push(backUrl)}
        className="text-text-dim hover:text-accent text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        返回上一步
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-lg">📚</div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 text-accent text-xs font-semibold mb-2">
            第 4 步 / 4 · 找到更具体的参考方向
          </div>
          <h1 className="text-2xl font-bold text-text">参考研究列表</h1>
          <p className="text-sm text-text-dim">
            以下是与你选择的方向相关的研究案例，勾选你感兴趣的
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {references.map((ref, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full text-left bg-white rounded-2xl border-2 p-5 transition-all ${
              selected.has(i)
                ? "border-accent bg-accent/[0.02] shadow-md shadow-accent/10"
                : "border-transparent hover:border-border hover:shadow-sm"
            }`}
            style={{ borderColor: selected.has(i) ? undefined : "transparent", boxShadow: selected.has(i) ? undefined : "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors ${
                  selected.has(i)
                    ? "bg-accent border-accent text-white"
                    : "border-border bg-white"
                }`}
              >
                {selected.has(i) && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-text mb-1">{ref.title}</h3>
                <p className="text-sm text-text-dim mb-3">{ref.description}</p>
                <div className="flex gap-2">
                  <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full">
                    {ref.field}
                  </span>
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${DIFFICULTY_STYLE[ref.difficulty] || "bg-surface2 text-text-muted"}`}>
                    {ref.difficulty}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <button
          onClick={() => router.push(recommendUrl)}
          className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
        >
          继续，为我推荐课题
        </button>
      </div>
    </div>
  );
}

export default function TopicReferencesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <ReferencesContent />
    </Suspense>
  );
}
