"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getTopicDraft, saveTopicDraft } from "@/lib/topic-draft";

interface Reference {
  title: string;
  description: string;
  difficulty: string;
  field: string;
  source?: string;
  url?: string | null;
  year?: number | null;
  authors?: string[];
  citationCount?: number;
}

const DEFAULT_REFERENCES: Reference[] = [
  { title: "青少年社交媒体使用对心理健康的影响", description: "调查不同社交平台使用时间与心理健康指标的相关性", difficulty: "中等", field: "心理学" },
  { title: "校园垃圾分类效果评估", description: "设计实验评估不同宣传方式对学生垃圾分类行为的影响", difficulty: "入门", field: "环境科学" },
  { title: "AI 辅助学习工具的效果分析", description: "对比使用AI学习工具和传统方式的学习效果差异", difficulty: "中等", field: "教育技术" },
  { title: "本地河流水质变化追踪", description: "通过定期采样检测分析河流水质变化趋势及原因", difficulty: "入门", field: "环境科学" },
  { title: "高中生睡眠质量与学业表现关系", description: "通过问卷和成绩数据分析两者的相关性", difficulty: "入门", field: "健康科学" },
  { title: "校园植物多样性调查", description: "记录和分析校园内植物种类及其生态功能", difficulty: "入门", field: "生物学" },
];

const MAX_EXPANDS_PER_ROUND = 3;

interface StrategyReference {
  title?: unknown;
  description?: unknown;
  difficulty?: unknown;
  field?: unknown;
}

function normalizeReference(raw: StrategyReference): Reference | null {
  if (typeof raw.title !== "string" || !raw.title.trim()) return null;
  return {
    title: raw.title.trim(),
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    difficulty: typeof raw.difficulty === "string" && raw.difficulty.trim()
      ? raw.difficulty.trim()
      : "Intermediate",
    field: typeof raw.field === "string" && raw.field.trim() ? raw.field.trim() : "Research",
  };
}

function normalizeReferences(parsed: Record<string, unknown>): Reference[] {
  if (!Array.isArray(parsed.references)) return [];
  return parsed.references
    .map((item) => normalizeReference(item as StrategyReference))
    .filter((item): item is Reference => item !== null);
}

function uniqueReferences(items: Reference[]): Reference[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackReferenceExpansion(keywords: string, locale: string, round: number): Reference[] {
  const zh = locale === "zh";
  const topic = keywords || (zh ? "已选方向" : "selected directions");
  const suffix = round > 1 ? ` ${round}` : "";
  return zh
    ? [
        {
          title: `${topic} 的小规模问卷研究${suffix}`,
          description: "围绕一个具体变量设计问卷，观察不同学生群体之间的差异。",
          difficulty: "入门",
          field: "调查研究",
        },
        {
          title: `${topic} 的公开数据探索${suffix}`,
          description: "寻找公开数据或可收集数据，用图表和简单统计发现可解释的模式。",
          difficulty: "中等",
          field: "数据分析",
        },
        {
          title: `${topic} 的案例比较研究${suffix}`,
          description: "选择两个典型案例，比较它们的背景、机制和结果差异。",
          difficulty: "中等",
          field: "案例研究",
        },
      ]
    : [
        {
          title: `Small survey study on ${topic}${suffix}`,
          description: "Design a focused survey around one variable and compare patterns across student groups.",
          difficulty: "Beginner",
          field: "Survey research",
        },
        {
          title: `Open data exploration for ${topic}${suffix}`,
          description: "Find public or collectable data, then use charts and simple statistics to identify explainable patterns.",
          difficulty: "Intermediate",
          field: "Data analysis",
        },
        {
          title: `Comparative case study of ${topic}${suffix}`,
          description: "Compare two concrete cases and analyze differences in context, mechanism, and outcome.",
          difficulty: "Intermediate",
          field: "Case study",
        },
      ];
}

function getMatchingDraft(
  conversationId: string | null,
  keywords: string
) {
  const draft = getTopicDraft();
  if (
    draft?.references?.length &&
    draft.conversationId === conversationId &&
    draft.selectedKeywords.join(",") === keywords
  ) {
    return draft;
  }
  return null;
}

function ReferencesContent() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const keywords = searchParams.get("keywords") || "";
  const conversationId = searchParams.get("conversationId");
  const t = useTranslations("topicReferences");
  const [loading, setLoading] = useState(false);
  const [references, setReferences] = useState<Reference[]>(
    () => getMatchingDraft(conversationId, keywords)?.references ?? DEFAULT_REFERENCES
  );
  const referencesRef = useRef<Reference[]>(
    getMatchingDraft(conversationId, keywords)?.references ?? DEFAULT_REFERENCES
  );
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(getMatchingDraft(conversationId, keywords)?.selectedRefs ?? [])
  );
  const [expanding, setExpanding] = useState(false);
  const [expandCount, setExpandCount] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [supplement, setSupplement] = useState("");
  const [notice, setNotice] = useState("");

  const DIFFICULTY_LABELS: Record<string, string> = {
    "入门": t("diffBeginner"),
    "中等": t("diffIntermediate"),
    "进阶": t("diffAdvanced"),
    "Real paper": t("realPaper"),
    "Beginner": t("diffBeginner"),
    "Intermediate": t("diffIntermediate"),
    "Advanced": t("diffAdvanced"),
  };

  const DIFFICULTY_STYLE: Record<string, string> = {
    "入门": "bg-green/10 text-green",
    "中等": "bg-amber/10 text-amber",
    "进阶": "bg-rose/10 text-rose",
    "Real paper": "bg-green/10 text-green",
    "Beginner": "bg-green/10 text-green",
    "Intermediate": "bg-amber/10 text-amber",
    "Advanced": "bg-rose/10 text-rose",
  };

  const recommendUrl = conversationId
    ? `/${locale}/topic/recommend?keywords=${encodeURIComponent(keywords)}&refs=${encodeURIComponent([...selected].map((i) => references[i].title).join(","))}&conversationId=${conversationId}`
    : `/${locale}/topic/recommend?keywords=${encodeURIComponent(keywords)}&refs=${encodeURIComponent([...selected].map((i) => references[i].title).join(","))}`;
  const backUrl = conversationId
    ? `/${locale}/topic/keywords?conversationId=${conversationId}`
    : `/${locale}/topic/keywords`;

  // Fetch fresh references when there is no matching draft for this conversation.
  useEffect(() => {
    if (getMatchingDraft(conversationId, keywords)) return;
    if (!keywords) return;
    async function fetchReferences() {
      setLoading(true);
      try {
        const realRes = await fetch(
          `/api/references/semantic-scholar?query=${encodeURIComponent(keywords)}&limit=8`
        );
        const realData = await realRes.json();
        if (Array.isArray(realData.references) && realData.references.length > 0) {
          setReferences(realData.references);
          saveTopicDraft({ conversationId, references: realData.references });
          setLoading(false);
          return;
        }

        const aiRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-locale": locale },
          body: JSON.stringify({
            strategyCode: "AI-S04",
            input: `Selected keywords: ${keywords}`,
            conversationId,
            context: "Generate reference research ideas based on the user's conversation transcript, profile, and selected keywords. Mark these as AI-generated ideas, not verified papers.",
          }),
        });
        const aiData = await aiRes.json();
        const jsonMatch = aiData.result?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const generatedReferences = normalizeReferences(parsed);
          if (generatedReferences.length > 0) {
            const aiReferences = generatedReferences.map((ref: Reference) => ({
              ...ref,
              source: "AI generated idea",
            }));
            referencesRef.current = aiReferences;
            setReferences(aiReferences);
            saveTopicDraft({ conversationId, references: aiReferences });
          }
        }
      } catch {
        // keep default references
      }
      setLoading(false);
    }
    fetchReferences();
  }, [keywords, conversationId, locale]);

  useEffect(() => {
    referencesRef.current = references;
  }, [references]);

  async function requestReferences(input: string, context: string) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-locale": locale },
      body: JSON.stringify({
        strategyCode: "AI-S04",
        input,
        conversationId,
        context,
      }),
    });
    const data = await res.json();
    const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    return normalizeReferences(JSON.parse(jsonMatch[0]));
  }

  async function expandReferences() {
    if (expanding || expandCount >= MAX_EXPANDS_PER_ROUND) return;
    setExpanding(true);
    setNotice("");
    const nextRound = expandCount + 1;
    try {
      const current = referencesRef.current;
      const generated = await requestReferences(
        `Expand the reference research list with 4-6 additional ideas. Selected keywords: ${keywords}. Existing ideas: ${current.map((ref) => ref.title).join("; ")}. Avoid duplicates and open up genuinely new angles.`,
        "The user has not chosen a final direction yet. Think broadly but stay truthful to the user's profile, conversation, and selected keywords. Return only additional reference research cases."
      );
      const beforeCount = current.length;
      let next = uniqueReferences([...current, ...generated]);
      if (next.length === beforeCount) {
        next = uniqueReferences([...current, ...fallbackReferenceExpansion(keywords, locale, nextRound)]);
      }
      referencesRef.current = next;
      setReferences(next);
      setExpandCount(nextRound);
      saveTopicDraft({ references: next });
      setNotice(t("expandedCount", { count: Math.max(0, next.length - beforeCount) }));
    } catch {
      const current = referencesRef.current;
      const beforeCount = current.length;
      const next = uniqueReferences([...current, ...fallbackReferenceExpansion(keywords, locale, nextRound)]);
      referencesRef.current = next;
      setReferences(next);
      setExpandCount(nextRound);
      saveTopicDraft({ references: next });
      setNotice(t("expandedCount", { count: Math.max(0, next.length - beforeCount) }));
    } finally {
      setExpanding(false);
    }
  }

  async function regenerateReferences() {
    setRegenerating(true);
    setNotice("");
    try {
      const extra = supplement.trim()
        ? `\nAdditional user guidance: ${supplement.trim()}`
        : "\nThe user did not add more information. Reconsider the strategy and provide a fresher, more useful mix.";
      const generated = await requestReferences(
        `Regenerate a fresh reference research list for this student.${extra}\nSelected keywords: ${keywords}\nPrevious ideas: ${referencesRef.current.map((ref) => ref.title).join("; ")}`,
        "Regenerate the whole reference list. It must stay grounded in the conversation, profile, and selected keywords while offering a noticeably different set of research-case ideas."
      );
      const next = uniqueReferences(
        generated.length > 0
          ? generated
          : fallbackReferenceExpansion(keywords, locale, 1)
      );
      referencesRef.current = next;
      setReferences(next);
      setSelected(new Set());
      setExpandCount(0);
      saveTopicDraft({ conversationId, references: next, selectedRefs: [] });
      setRegenerateOpen(false);
      setSupplement("");
      setNotice(t("regeneratedNotice"));
    } catch {
      setNotice(t("regenerateFailed"));
    } finally {
      setRegenerating(false);
    }
  }

  const toggle = (index: number) => {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelected(next);
    saveTopicDraft({ selectedRefs: [...next] });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin mb-4" />
        <p className="text-text-dim">{t("loading")}</p>
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
        {t("back")}
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-lg">📚</div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 text-accent text-xs font-semibold mb-2">
            {t("step", { current: 4, total: 4 })}
          </div>
          <h1 className="text-2xl font-bold text-text">{t("title")}</h1>
          <p className="text-sm text-text-dim">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-text">{t("exploreTitle")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              {expandCount < MAX_EXPANDS_PER_ROUND
                ? t("expandHint", { remaining: MAX_EXPANDS_PER_ROUND - expandCount })
                : t("regenerateHint")}
            </p>
            {notice && <p className="mt-2 text-xs font-medium text-text-muted">{notice}</p>}
          </div>
          {expandCount < MAX_EXPANDS_PER_ROUND ? (
            <button
              onClick={expandReferences}
              disabled={expanding}
              className="shrink-0 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {expanding ? t("expanding") : t("expand", { remaining: MAX_EXPANDS_PER_ROUND - expandCount })}
            </button>
          ) : (
            <button
              onClick={() => setRegenerateOpen(true)}
              className="shrink-0 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text-dim transition-colors hover:border-accent hover:text-accent"
            >
              {t("regenerate")}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {references.map((ref, i) => (
          <div
            key={i}
            onClick={() => toggle(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") toggle(i);
            }}
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
                {ref.authors && ref.authors.length > 0 && (
                  <p className="text-xs text-text-muted mb-3">
                    {ref.authors.join(", ")}
                    {ref.year ? ` · ${ref.year}` : ""}
                    {typeof ref.citationCount === "number" ? ` · ${ref.citationCount} citations` : ""}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full">
                    {ref.field}
                  </span>
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${DIFFICULTY_STYLE[ref.difficulty] || "bg-surface2 text-text-muted"}`}>
                    {DIFFICULTY_LABELS[ref.difficulty] ?? ref.difficulty}
                  </span>
                  {ref.source && (
                    <span className="px-2.5 py-0.5 bg-green/10 text-green text-xs font-medium rounded-full">
                      {ref.source}
                    </span>
                  )}
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="px-2.5 py-0.5 bg-surface2 text-text-muted text-xs font-medium rounded-full hover:text-accent"
                    >
                      {t("sourceAvailable")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <button
          onClick={() => {
            saveTopicDraft({ step: "recommend", selectedRefs: [...selected] });
            router.push(recommendUrl);
          }}
          className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
        >
          {t("continue")}
        </button>
      </div>

      {regenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text/30 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text">{t("regenerateModalTitle")}</h2>
                <p className="mt-1 text-sm leading-relaxed text-text-dim">
                  {t("regenerateModalSubtitle")}
                </p>
              </div>
              <button
                onClick={() => setRegenerateOpen(false)}
                className="rounded-lg px-2 py-1 text-text-muted transition-colors hover:bg-surface2 hover:text-text"
                aria-label={t("close")}
              >
                ×
              </button>
            </div>
            <label htmlFor="reference-supplement" className="mt-5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("supplementLabel")}
            </label>
            <textarea
              id="reference-supplement"
              value={supplement}
              onChange={(event) => setSupplement(event.target.value)}
              placeholder={t("supplementPlaceholder")}
              rows={4}
              className="mt-2 w-full resize-y rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-text placeholder-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setRegenerateOpen(false)}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text-dim transition-colors hover:border-accent hover:text-accent"
              >
                {t("cancel")}
              </button>
              <button
                onClick={regenerateReferences}
                disabled={regenerating}
                className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {regenerating ? t("regenerating") : t("regenerateNow")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TopicReferencesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">...</div></div>}>
      <ReferencesContent />
    </Suspense>
  );
}
