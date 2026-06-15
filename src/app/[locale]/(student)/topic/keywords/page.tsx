"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getTopicDraft, saveTopicDraft } from "@/lib/topic-draft";

interface Keyword {
  word: string;
  description: string;
  category: string;
}

interface StrategyKeyword {
  word?: unknown;
  label?: unknown;
  description?: unknown;
  category?: unknown;
}

interface StrategyCategory {
  name?: unknown;
  keywords?: unknown;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Technology": { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
  "Natural Science": { bg: "bg-green/10", text: "text-green", border: "border-green/20" },
  "Social Science": { bg: "bg-purple/10", text: "text-purple", border: "border-purple/20" },
  "Biology": { bg: "bg-cyan/10", text: "text-cyan", border: "border-cyan/20" },
  "Engineering": { bg: "bg-amber/10", text: "text-amber", border: "border-amber/20" },
  "Humanities": { bg: "bg-rose/10", text: "text-rose", border: "border-rose/20" },
};

const DEFAULT_KEYWORDS_ZH: Keyword[] = [
  { word: "人工智能", description: "AI技术及其应用", category: "Technology" },
  { word: "数据分析", description: "统计与可视化", category: "Technology" },
  { word: "机器人", description: "自动化与控制系统", category: "Technology" },
  { word: "环境保护", description: "气候变化与生态", category: "Natural Science" },
  { word: "新能源", description: "太阳能、风能等", category: "Natural Science" },
  { word: "天文观测", description: "星体与宇宙研究", category: "Natural Science" },
  { word: "心理学", description: "行为与认知研究", category: "Social Science" },
  { word: "社交媒体", description: "社会影响力研究", category: "Social Science" },
  { word: "教育公平", description: "教育资源分配", category: "Social Science" },
  { word: "基因编辑", description: "CRISPR技术与伦理", category: "Biology" },
  { word: "食品安全", description: "营养与健康", category: "Biology" },
  { word: "城市规划", description: "智慧城市设计", category: "Engineering" },
  { word: "文学分析", description: "作品与文化研究", category: "Humanities" },
];

const DEFAULT_KEYWORDS_EN: Keyword[] = [
  { word: "Artificial Intelligence", description: "AI technologies and real-world applications", category: "Technology" },
  { word: "Data Analysis", description: "Statistics, visualization, and evidence-based reasoning", category: "Technology" },
  { word: "Robotics", description: "Automation, sensing, and control systems", category: "Technology" },
  { word: "Environmental Protection", description: "Climate change, ecology, and sustainability", category: "Natural Science" },
  { word: "Renewable Energy", description: "Solar, wind, and future energy systems", category: "Natural Science" },
  { word: "Astronomy", description: "Observation of stars, planets, and the universe", category: "Natural Science" },
  { word: "Psychology", description: "Behavior, cognition, and motivation research", category: "Social Science" },
  { word: "Social Media", description: "Digital platforms and social influence", category: "Social Science" },
  { word: "Education Equity", description: "Access, learning opportunities, and resource distribution", category: "Social Science" },
  { word: "Gene Editing", description: "CRISPR technology and bioethics", category: "Biology" },
  { word: "Food Safety", description: "Nutrition, health, and risk analysis", category: "Biology" },
  { word: "Urban Planning", description: "Smart cities and community design", category: "Engineering" },
  { word: "Literary Analysis", description: "Texts, culture, and interpretation", category: "Humanities" },
];

function getDefaultKeywords(locale: string) {
  return locale === "zh" ? DEFAULT_KEYWORDS_ZH : DEFAULT_KEYWORDS_EN;
}

function normalizeKeyword(raw: StrategyKeyword, fallbackCategory = "Technology"): Keyword | null {
  const word = typeof raw.word === "string"
    ? raw.word
    : typeof raw.label === "string"
      ? raw.label
      : "";
  if (!word.trim()) return null;

  return {
    word: word.trim(),
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    category: typeof raw.category === "string" && raw.category.trim()
      ? raw.category.trim()
      : fallbackCategory,
  };
}

function normalizeKeywords(parsed: Record<string, unknown>): Keyword[] {
  if (Array.isArray(parsed.keywords)) {
    return parsed.keywords
      .map((item) => normalizeKeyword(item as StrategyKeyword))
      .filter((item): item is Keyword => item !== null);
  }

  if (Array.isArray(parsed.categories)) {
    return parsed.categories.flatMap((category) => {
      const cat = category as StrategyCategory;
      const name = typeof cat.name === "string" && cat.name.trim()
        ? cat.name.trim()
        : "Technology";
      if (!Array.isArray(cat.keywords)) return [];
      return cat.keywords
        .map((item) => normalizeKeyword(item as StrategyKeyword, name))
        .filter((item): item is Keyword => item !== null);
    });
  }

  return [];
}

function KeywordsContent() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const t = useTranslations("topicKeywords");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>(() => getDefaultKeywords(locale));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const CATEGORY_LABELS: Record<string, string> = {
    "Technology": t("catTech"),
    "Natural Science": t("catNaturalSci"),
    "Social Science": t("catSocialSci"),
    "Biology": t("catBiology"),
    "Engineering": t("catEngineering"),
    "Humanities": t("catHumanities"),
  };

  // Restore from draft on mount.
  useEffect(() => {
    const draft = getTopicDraft();
    if (
      draft?.keywords?.length &&
      draft.conversationId &&
      draft.conversationId === conversationId
    ) {
      setKeywords(draft.keywords);
      setSelected(new Set(draft.selectedKeywords));
      return;
    }
    if (!conversationId) return;
    async function fetchKeywords() {
      setLoading(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-locale": locale },
          body: JSON.stringify({
            strategyCode: "AI-S03",
            conversationId,
            context: "Generate research keyword recommendations strictly based on the user's profile and conversation transcript.",
          }),
        });
        const data = await res.json();
        const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const generatedKeywords = normalizeKeywords(parsed);
          if (generatedKeywords.length > 0) {
            setKeywords(generatedKeywords);
            saveTopicDraft({
              conversationId,
              keywords: generatedKeywords,
              selectedKeywords: [],
            });
          }
        }
      } catch {
        // keep default keywords
      }
      setLoading(false);
    }
    fetchKeywords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const toggle = (word: string) => {
    const next = new Set(selected);
    if (next.has(word)) next.delete(word);
    else next.add(word);
    setSelected(next);
    saveTopicDraft({ selectedKeywords: [...next] });
  };

  const categories = [...new Set(keywords.map((k) => k.category))];
  const selectedKeywordsParam = encodeURIComponent([...selected].join(","));
  const referencesUrl = conversationId
    ? `/${locale}/topic/references?keywords=${selectedKeywordsParam}&conversationId=${conversationId}`
    : `/${locale}/topic/references?keywords=${selectedKeywordsParam}`;
  const backUrl = conversationId
    ? `/${locale}/topic/profile?conversationId=${conversationId}`
    : `/${locale}/topic/profile?quickStart=1`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-purple/20 border-t-purple rounded-full animate-spin mb-4" />
        <p className="text-text-dim">{t("generating")}</p>
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

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 text-accent text-xs font-semibold mb-4">
          {t("step", { current: 3, total: 4 })}
        </div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-purple/10 flex items-center justify-center text-3xl mx-auto mb-4">
          🏷️
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">{t("title")}</h1>
        <p className="text-text-dim">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((cat) => {
          const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS["Technology"];
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${colors.bg.replace("/10", "")}`} style={{ background: "currentColor" }} />
                <h3 className={`text-sm font-bold ${colors.text} uppercase tracking-wider`}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords
                  .filter((k) => k.category === cat)
                  .map((k) => (
                    <button
                      key={k.word}
                      onClick={() => toggle(k.word)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                        selected.has(k.word)
                          ? "bg-accent text-white border-accent shadow-md shadow-accent/20"
                          : `bg-white ${colors.border} text-text-dim hover:border-accent hover:text-accent`
                      }`}
                      title={k.description}
                    >
                      {k.word}
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="mt-8 bg-accent/5 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-sm text-accent font-medium">
            {t("selected", { count: selected.size })}
          </span>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {[...selected].map((word) => (
              <span key={word} className="px-2.5 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={() => {
            saveTopicDraft({ step: "references", selectedKeywords: [...selected] });
            router.push(referencesUrl);
          }}
          disabled={selected.size === 0}
          className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-accent/20"
        >
          {t("confirm", { count: selected.size })}
        </button>
      </div>
    </div>
  );
}

export default function TopicKeywordsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">...</div></div>}>
      <KeywordsContent />
    </Suspense>
  );
}
