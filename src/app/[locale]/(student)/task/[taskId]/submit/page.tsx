"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

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
  const contentFromQuery = searchParams.get("content") || "";
  const isResubmission = searchParams.get("resubmit") === "true";
  const hintUsed = searchParams.get("hintUsed") === "true";
  const t = useTranslations("taskSubmit");
  const locale = useLocale();
  const submittedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    grade: string;
    feedback: string;
    suggestions: string;
    content: string;
    id: string;
  } | null>(null);

  useEffect(() => {
    async function submit() {
      if (submittedRef.current) return;
      submittedRef.current = true;

      let content = contentFromQuery;
      const stored = sessionStorage.getItem(`task-submission-${taskId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { content?: string };
          content = parsed.content || content;
        } catch {
          // Keep the query-string fallback for older submission links.
        }
      }

      if (!content.trim()) {
        router.replace(`/${locale}/task/${taskId}?projectId=${projectId}`);
        return;
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          taskId,
          content,
          isResubmission,
          hintUsed,
        }),
      });
      const data = await res.json();
      sessionStorage.removeItem(`task-submission-${taskId}`);
      setResult(data);
      setLoading(false);
    }
    submit();
  }, [taskId, contentFromQuery, isResubmission, hintUsed, locale, projectId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-green/20 border-t-green rounded-full animate-spin mb-4" />
        <p className="text-text-dim">{t("loading")}</p>
      </div>
    );
  }

  if (!result) return null;

  const gradeConfig: Record<string, { color: string; bg: string; label: string }> = {
    A: { color: "#22c55e", bg: "bg-green/10", label: t("gradeA") },
    B: { color: "#6366f1", bg: "bg-accent/10", label: t("gradeB") },
    C: { color: "#f59e0b", bg: "bg-amber/10", label: t("gradeC") },
    D: { color: "#f43f5e", bg: "bg-rose/10", label: t("gradeD") },
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
      <h1 className="text-2xl font-bold mb-8 text-text">{t("title")}</h1>

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
            {t("hintUsed")}
          </p>
        )}
      </div>

      {/* Submitted content */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <h3 className="text-sm font-semibold text-text-muted mb-3">{t("yourSubmission")}</h3>
        <p className="text-sm text-text-dim whitespace-pre-wrap">{result.content}</p>
      </div>

      {/* Feedback */}
      <div className="bg-white rounded-2xl border-2 p-5 mb-4" style={{ borderColor: gc.color }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: gc.color }}>{t("mentorComment")}</h3>
        <p className="text-text-dim whitespace-pre-wrap leading-relaxed">{result.feedback}</p>
      </div>

      {/* Improvement suggestions */}
      {improvements.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-5 mb-8">
          <h3 className="text-sm font-semibold text-text-muted mb-4">{t("improvements")}</h3>
          <div className="space-y-4">
            {improvements.map((imp, i) => {
              const impGc = gradeConfig[imp.targetGrade] || gradeConfig.B;
              return (
                <div key={i}>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                    style={{ background: impGc.color }}
                  >
                    {t("reachGrade", { grade: imp.targetGrade })}
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
              router.push(`/${locale}/task/${taskId}/hint?projectId=${projectId}`)
            }
            className="flex-1 py-3.5 bg-amber hover:bg-amber/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-amber/20"
          >
            {t("getHint")}
          </button>
        ) : (
          <button
            onClick={() => router.push(`/${locale}/map?projectId=${projectId}`)}
            className="flex-1 py-3.5 bg-green hover:bg-green/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green/20"
          >
            {result.grade === "A" || result.grade === "B"
              ? t("nextTask")
              : t("backMap")}
          </button>
        )}

        {result.grade !== "A" && result.grade !== "D" && (
          <button
            onClick={() => router.push(`/${locale}/task/${taskId}?projectId=${projectId}`)}
            className="px-6 py-3.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
          >
            {t("resubmit")}
          </button>
        )}
      </div>
    </div>
  );
}

function SubmitFallback() {
  const t = useTranslations("taskSubmit");
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-text-dim">{t("loading")}</div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<SubmitFallback />}>
      <SubmitContent />
    </Suspense>
  );
}
