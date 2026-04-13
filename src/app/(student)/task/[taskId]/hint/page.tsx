"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

interface HintData {
  template: string;
  steps: string[];
  keyPoints: string[];
}

function HintContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = params.taskId as string;
  const projectId = searchParams.get("projectId");
  const [loading, setLoading] = useState(true);
  const [hint, setHint] = useState<HintData | null>(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    async function fetchHint() {
      const projRes = await fetch("/api/projects");
      const projects = await projRes.json();
      let task = null;
      for (const p of projects) {
        for (const phase of p.phases) {
          const found = phase.tasks.find((t: { id: string }) => t.id === taskId);
          if (found) {
            task = { ...found, phaseName: phase.name, topicName: p.topic?.name || "" };
            break;
          }
        }
      }

      if (!task) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategyCode: "AI-S17",
            input: `任务：${task.title}\n描述：${task.description || ""}\n课题：${task.topicName}`,
          }),
        });
        const data = await res.json();
        const jsonMatch = data.result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setHint(JSON.parse(jsonMatch[0]));
        } else {
          setHint({
            template: data.result,
            steps: [],
            keyPoints: [],
          });
        }
      } catch {
        setHint({
          template: `# ${task.title} - 任务模板\n\n## 第一步：理解任务要求\n请重新阅读任务描述，明确需要完成的内容。\n\n## 第二步：收集信息\n列出你已知的相关信息。\n\n## 第三步：组织内容\n按照以下框架组织你的回答：\n- 背景说明\n- 主要内容\n- 总结`,
          steps: ["重新理解任务要求", "参考模板框架", "填充你的内容", "检查并提交"],
          keyPoints: ["不需要完美，重在思考过程", "可以参考讲解内容获得灵感"],
        });
      }
      setLoading(false);
    }
    fetchHint();
  }, [taskId]);

  const handleResubmit = () => {
    if (!content.trim()) return;
    router.push(
      `/task/${taskId}/submit?projectId=${projectId}&content=${encodeURIComponent(content)}&resubmit=true&hintUsed=true`
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-amber/20 border-t-amber rounded-full animate-spin mb-4" />
        <p className="text-text-dim">正在生成 Hint 辅助内容...</p>
      </div>
    );
  }

  if (!hint) return <div className="text-center py-20 text-text-dim">加载失败</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-text-dim hover:text-accent text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        返回
      </button>

      {/* Warning banner */}
      <div className="bg-amber/10 border border-amber/20 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber/20 flex items-center justify-center text-lg shrink-0">💡</div>
          <div>
            <h1 className="text-lg font-bold text-amber mb-1">Hint 辅助</h1>
            <p className="text-sm text-text-dim">
              别担心！这里有一些指引帮你完成这个任务。
              <span className="font-semibold text-amber"> 注意：使用 Hint 后，本次任务最高评分为 C。</span>
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      {hint.steps.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-5 mb-4">
          <h3 className="text-sm font-semibold text-accent mb-3">步骤指引</h3>
          <div className="space-y-3">
            {hint.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-text-dim pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key points */}
      {hint.keyPoints.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber/20 p-5 mb-4">
          <h3 className="text-sm font-semibold text-amber mb-3">关键提示</h3>
          <ul className="space-y-2">
            {hint.keyPoints.map((point, i) => (
              <li key={i} className="text-sm text-text-dim flex items-start gap-2">
                <span className="text-amber">💡</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Template */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-6">
        <h3 className="text-sm font-semibold text-cyan mb-3">参考模板</h3>
        <div className="p-4 bg-surface2 rounded-xl text-sm text-text-dim whitespace-pre-wrap font-mono border border-dashed border-border">
          {hint.template}
        </div>
      </div>

      {/* Resubmit area */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-bold mb-4 text-text">重新提交</h3>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text placeholder-text-muted font-mono resize-y focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
          placeholder="参考以上模板和提示，重新完成你的产出..."
        />
        <button
          onClick={handleResubmit}
          disabled={!content.trim()}
          className="mt-4 px-8 py-3 bg-amber hover:bg-amber/90 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-amber/20"
        >
          重新提交（最高评分 C）
        </button>
      </div>
    </div>
  );
}

export default function HintPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <HintContent />
    </Suspense>
  );
}
