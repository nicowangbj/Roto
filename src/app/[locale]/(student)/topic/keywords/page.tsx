"use client";

import { useEffect, useRef, useState, Suspense } from "react";
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

const MAX_EXPANDS_PER_CATEGORY = 3;

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

function uniqueKeywords(items: Keyword[]): Keyword[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.word.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackExpansion(category: string, locale: string, round: number): Keyword[] {
  const zh = locale === "zh";
  const suffix = round > 1 ? ` ${round}` : "";
  const map: Record<string, Keyword[]> = {
    "Sociology & Economics": zh
      ? [
          { word: `社会流动${suffix}`, description: "研究家庭背景、教育机会与发展路径", category },
          { word: `教育不平等${suffix}`, description: "分析资源差异对学习机会的影响", category },
          { word: `青年就业预期${suffix}`, description: "调查学生对未来职业和收入的判断", category },
        ]
      : [
          { word: `Social mobility${suffix}`, description: "Study background, education, and opportunity pathways", category },
          { word: `Educational inequality${suffix}`, description: "Analyze how resources shape learning opportunities", category },
          { word: `Youth career expectations${suffix}`, description: "Explore student views of work, income, and future choices", category },
        ],
    "Behavioral Economics": zh
      ? [
          { word: `损失厌恶${suffix}`, description: "研究人们如何看待损失与收益", category },
          { word: `时间折扣${suffix}`, description: "分析即时满足与长期收益之间的选择", category },
          { word: `默认选项效应${suffix}`, description: "研究默认设置如何影响决策", category },
        ]
      : [
          { word: `Loss aversion${suffix}`, description: "Study how people weigh losses and gains", category },
          { word: `Time discounting${suffix}`, description: "Analyze choices between immediate and long-term rewards", category },
          { word: `Default effect${suffix}`, description: "Explore how default options influence decisions", category },
        ],
    "Consumer Behavior": zh
      ? [
          { word: `品牌忠诚${suffix}`, description: "研究学生如何形成品牌偏好", category },
          { word: `冲动消费${suffix}`, description: "分析情绪和情境对购买行为的影响", category },
          { word: `社交媒体种草${suffix}`, description: "研究内容推荐如何影响消费选择", category },
        ]
      : [
          { word: `Brand loyalty${suffix}`, description: "Study how students form brand preferences", category },
          { word: `Impulse buying${suffix}`, description: "Analyze how emotions and context affect purchases", category },
          { word: `Social media influence${suffix}`, description: "Explore how recommendations shape consumer choices", category },
        ],
    "Psychology & Statistics": zh
      ? [
          { word: `学习动机${suffix}`, description: "用问卷和数据分析学习投入", category },
          { word: `压力感知${suffix}`, description: "研究压力来源和自我调节方式", category },
          { word: `相关性分析${suffix}`, description: "用统计方法观察变量之间的关系", category },
        ]
      : [
          { word: `Learning motivation${suffix}`, description: "Use survey data to analyze study engagement", category },
          { word: `Perceived stress${suffix}`, description: "Study stress sources and self-regulation patterns", category },
          { word: `Correlation analysis${suffix}`, description: "Use statistics to explore relationships between variables", category },
        ],
    "Microeconomics": zh
      ? [
          { word: `机会成本${suffix}`, description: "分析有限时间和资源下的选择", category },
          { word: `价格弹性${suffix}`, description: "研究价格变化如何影响需求", category },
          { word: `激励机制${suffix}`, description: "观察奖励或规则如何改变行为", category },
        ]
      : [
          { word: `Opportunity cost${suffix}`, description: "Analyze choices under limited time and resources", category },
          { word: `Price elasticity${suffix}`, description: "Study how price changes affect demand", category },
          { word: `Incentive design${suffix}`, description: "Observe how rewards or rules change behavior", category },
        ],
  };

  return map[category] ?? [
    {
      word: zh ? `${category} 入门方向${suffix}` : `Introductory ${category} topic${suffix}`,
      description: zh ? "从该领域中选择一个可观察、可调查的小问题" : "Choose a focused question that can be observed or investigated",
      category,
    },
    {
      word: zh ? `${category} 数据探索${suffix}` : `${category} data exploration${suffix}`,
      description: zh ? "收集简单数据，寻找变量之间的关系" : "Collect simple data and explore relationships between variables",
      category,
    },
    {
      word: zh ? `${category} 案例比较${suffix}` : `${category} case comparison${suffix}`,
      description: zh ? "比较两个案例，分析差异背后的原因" : "Compare two cases and analyze reasons behind the differences",
      category,
    },
  ];
}

function KeywordsContent() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const t = useTranslations("topicKeywords");
  const [loading, setLoading] = useState(false);
  const [expandingCategories, setExpandingCategories] = useState<Set<string>>(new Set());
  const [expansionRounds, setExpansionRounds] = useState<Record<string, number>>({});
  const [categoryNotice, setCategoryNotice] = useState<Record<string, string>>({});
  const [regenerating, setRegenerating] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [supplement, setSupplement] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>(() => getDefaultKeywords(locale));
  const keywordsRef = useRef<Keyword[]>(getDefaultKeywords(locale));
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
      keywordsRef.current = draft.keywords;
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
            keywordsRef.current = generatedKeywords;
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

  useEffect(() => {
    keywordsRef.current = keywords;
  }, [keywords]);

  const toggle = (word: string) => {
    const next = new Set(selected);
    if (next.has(word)) next.delete(word);
    else next.add(word);
    setSelected(next);
    saveTopicDraft({ selectedKeywords: [...next] });
  };

  async function requestKeywords(input: string, context: string) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-locale": locale },
      body: JSON.stringify({
        strategyCode: "AI-S03",
        input,
        conversationId,
        context,
      }),
    });
    const data = await res.json();
    const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    return normalizeKeywords(JSON.parse(jsonMatch[0]));
  }

  async function expandCategory(category: string) {
    const round = (expansionRounds[category] ?? 0) + 1;
    if (expandingCategories.has(category) || round > MAX_EXPANDS_PER_CATEGORY) return;
    setExpandingCategories((current) => new Set(current).add(category));
    setCategoryNotice((current) => ({ ...current, [category]: "" }));
    try {
      const existing = keywords
        .filter((keyword) => keyword.category === category)
        .map((keyword) => keyword.word)
        .join(", ");
      const generated = await requestKeywords(
        `Expand the category "${category}" with 4-6 additional research keywords. Existing keywords: ${existing}. Return only keywords for this category.`,
        "The user is exploring research directions. Generate more keywords in the requested category only, strictly related to the user's profile and conversation."
      );
      const categoryKeywords = generated
        .map((keyword) => ({ ...keyword, category }))
        .filter((keyword) => keyword.word.trim().length > 0);
      const currentKeywords = keywordsRef.current;
      const beforeCount = currentKeywords.length;
      let next = uniqueKeywords([...currentKeywords, ...categoryKeywords]);
      if (next.length === beforeCount) {
        next = uniqueKeywords([...currentKeywords, ...fallbackExpansion(category, locale, round)]);
      }
      keywordsRef.current = next;
      setKeywords(next);
      saveTopicDraft({ keywords: next });
      setExpansionRounds((current) => ({ ...current, [category]: round }));
      setCategoryNotice((current) => ({
        ...current,
        [category]: t("expandedCount", {
          count: Math.max(0, next.length - beforeCount),
          remaining: Math.max(0, MAX_EXPANDS_PER_CATEGORY - round),
        }),
      }));
    } catch {
      const currentKeywords = keywordsRef.current;
      const beforeCount = currentKeywords.length;
      const next = uniqueKeywords([...currentKeywords, ...fallbackExpansion(category, locale, round)]);
      keywordsRef.current = next;
      setKeywords(next);
      saveTopicDraft({ keywords: next });
      setExpansionRounds((current) => ({ ...current, [category]: round }));
      setCategoryNotice((current) => ({
        ...current,
        [category]: t("expandedCount", {
          count: Math.max(0, next.length - beforeCount),
          remaining: Math.max(0, MAX_EXPANDS_PER_CATEGORY - round),
        }),
      }));
    } finally {
      setExpandingCategories((current) => {
        const next = new Set(current);
        next.delete(category);
        return next;
      });
    }
  }

  async function regenerateKeywords() {
    setRegenerating(true);
    try {
      const extra = supplement.trim()
        ? `\nAdditional user guidance: ${supplement.trim()}`
        : "\nThe user did not add more information. Reconsider the current profile and diversify the strategy.";
      const generated = await requestKeywords(
        `Regenerate a fresh, more diverse keyword set for this student.${extra}\nCurrent keywords: ${keywords.map((keyword) => `${keyword.category}: ${keyword.word}`).join("; ")}`,
        "Regenerate the whole keyword set. Keep it truthful to the conversation and profile. Provide grouped directions that are specific, varied, and useful for research ideation."
      );
      if (generated.length > 0) {
        const next = uniqueKeywords(generated);
        keywordsRef.current = next;
        setKeywords(next);
        setSelected(new Set());
        setExpansionRounds({});
        setCategoryNotice({});
        saveTopicDraft({
          conversationId,
          keywords: next,
          selectedKeywords: [],
        });
      }
      setRefineOpen(false);
    } catch {
      // Keep the current keywords if regeneration fails.
    } finally {
      setRegenerating(false);
    }
  }

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

      <div className="mb-8 rounded-2xl border border-border bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-text">{t("refineTitle")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              {t("refineSubtitle")}
            </p>
          </div>
          <button
            onClick={() => setRefineOpen((open) => !open)}
            className="shrink-0 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-dim transition-colors hover:border-accent hover:text-accent"
          >
            {refineOpen ? t("hideRefine") : t("regenerate")}
          </button>
        </div>
        {refineOpen && (
          <div className="mt-4 border-t border-border/60 pt-4">
            <label htmlFor="keyword-supplement" className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("supplementLabel")}
            </label>
            <textarea
              id="keyword-supplement"
              value={supplement}
              onChange={(event) => setSupplement(event.target.value)}
              placeholder={t("supplementPlaceholder")}
              rows={3}
              className="mt-2 w-full resize-y rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-text placeholder-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-text-muted">{t("regenerateHint")}</p>
              <button
                onClick={regenerateKeywords}
                disabled={regenerating}
                className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {regenerating ? t("regenerating") : t("regenerateNow")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {categories.map((cat) => {
          const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS["Technology"];
          const expandedTimes = expansionRounds[cat] ?? 0;
          const remainingExpands = Math.max(0, MAX_EXPANDS_PER_CATEGORY - expandedTimes);
          const isExpanding = expandingCategories.has(cat);
          const canExpand = remainingExpands > 0;
          return (
            <div key={cat}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${colors.bg.replace("/10", "")}`} style={{ background: "currentColor" }} />
                  <h3 className={`text-sm font-bold ${colors.text} uppercase tracking-wider`}>
                    {CATEGORY_LABELS[cat] ?? cat}
                  </h3>
                </div>
                <button
                  onClick={() => expandCategory(cat)}
                  disabled={isExpanding || !canExpand}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${colors.border} ${colors.text} hover:bg-white disabled:opacity-45`}
                >
                  {isExpanding
                    ? t("expanding")
                    : canExpand
                      ? t("expandCategory", { remaining: remainingExpands })
                      : t("expandLimit")}
                </button>
              </div>
              {categoryNotice[cat] && (
                <p className="mb-3 text-xs font-medium text-text-muted">
                  {categoryNotice[cat]}
                </p>
              )}
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
