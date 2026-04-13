"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

interface Improvement {
  targetGrade: string;
  suggestions: string[];
}

function SubmitContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = params.taskId as string;
  const projectId = searchParams.get("projectId");
  const content = searchParams.get("content") || "";
  const isResubmission = searchParams.get("resubmit") === "true";
  const hintUsed = searchParams.get("hintUsed") === "true";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    grade: string;
    feedback: string;
    suggestions: string;
    id: string;
  } | null>(null);

  useEffect(() => {
    async function submit() {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          content,
          isResubmission,
          hintUsed,
        }),
      });
      const data = await res.json();
      setResult(data);
      setLoading(false);
    }
    submit();
  }, [taskId, content, isResubmission, hintUsed]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-green/20 border-t-green rounded-full animate-spin mb-4" />
        <p className="text-text-dim">AI 导师正在评审你的产出...</p>
      </div>
    );
  }

  if (!result) return null;

  const gradeConfig: Record<string, { color: string; bg: string; label: string }> = {
    A: { color: "#22c55e", bg: "bg-green/10", label: "优秀" },
    B: { color: "#6366f1", bg: "bg-accent/10", label: "良好" },
    C: { color: "#f59e0b", bg: "bg-amber/10", label: "合格" },
    D: { color: "#f43f5e", bg: "bg-rose/10", label: "不及格" },
  };

  const gc = gradeConfig[result.grade] || gradeConfig.B;

  let improvements: Improvement[] = [];
  try {
    improvements = JSON.parse(result.suggestions || "[]");
  } catch {
    improvements = [];
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-text">评审结果</h1>

      {/* Grade display - large centered */}
      <div className="text-center mb-8">
        <div
          className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl text-4xl font-black ${gc.bg}`}
          style={{ color: gc.color }}
        >
          {result.grade}
        </div>
        <p className="text-lg font-bold mt-3 text-text">{gc.label}</p>
        {hintUsed && (
          <p className="text-xs mt-1 text-amber font-medium">
            使用了Hint辅助，本次最高评分为 C
          </p>
        )}
      </div>

      {/* Submitted content */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <h3 className="text-sm font-semibold text-text-muted mb-3">你的提交</h3>
        <p className="text-sm text-text-dim whitespace-pre-wrap">{content}</p>
      </div>

      {/* Feedback */}
      <div className="bg-white rounded-2xl border-2 p-5 mb-4" style={{ borderColor: gc.color }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: gc.color }}>导师评语</h3>
        <p className="text-text-dim whitespace-pre-wrap leading-relaxed">{result.feedback}</p>
      </div>

      {/* Improvement suggestions */}
      {improvements.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-5 mb-8">
          <h3 className="text-sm font-semibold text-text-muted mb-4">改进建议</h3>
          <div className="space-y-4">
            {improvements.map((imp, i) => {
              const impGc = gradeConfig[imp.targetGrade] || gradeConfig.B;
              return (
                <div key={i}>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                    style={{ background: impGc.color }}
                  >
                    达到 {imp.targetGrade}
                  </span>
                  <ul className="mt-2 space-y-1.5">
                    {imp.suggestions.map((s, j) => (
                      <li key={j} className="text-sm text-text-dim flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {result.grade === "D" ? (
          <button
            onClick={() =>
              router.push(`/task/${taskId}/hint?projectId=${projectId}`)
            }
            className="flex-1 py-3.5 bg-amber hover:bg-amber/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-amber/20"
          >
            获取 Hint 辅助
          </button>
        ) : (
          <button
            onClick={() => router.push(`/map?projectId=${projectId}`)}
            className="flex-1 py-3.5 bg-green hover:bg-green/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green/20"
          >
            {result.grade === "A" || result.grade === "B"
              ? "继续下一个任务"
              : "返回科研地图"}
          </button>
        )}

        {result.grade !== "A" && result.grade !== "D" && (
          <button
            onClick={() => router.push(`/task/${taskId}?projectId=${projectId}`)}
            className="px-6 py-3.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
          >
            重新提交
          </button>
        )}
      </div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <SubmitContent />
    </Suspense>
  );
}
