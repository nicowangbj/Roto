"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Keyword {
  word: string;
  description: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "技术": { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
  "自然科学": { bg: "bg-green/10", text: "text-green", border: "border-green/20" },
  "社会科学": { bg: "bg-purple/10", text: "text-purple", border: "border-purple/20" },
  "生物": { bg: "bg-cyan/10", text: "text-cyan", border: "border-cyan/20" },
  "工程": { bg: "bg-amber/10", text: "text-amber", border: "border-amber/20" },
  "人文": { bg: "bg-rose/10", text: "text-rose", border: "border-rose/20" },
};

const DEFAULT_KEYWORDS: Keyword[] = [
  { word: "人工智能", description: "AI技术及其应用", category: "技术" },
  { word: "数据分析", description: "统计与可视化", category: "技术" },
  { word: "机器人", description: "自动化与控制系统", category: "技术" },
  { word: "环境保护", description: "气候变化与生态", category: "自然科学" },
  { word: "新能源", description: "太阳能、风能等", category: "自然科学" },
  { word: "天文观测", description: "星体与宇宙研究", category: "自然科学" },
  { word: "心理学", description: "行为与认知研究", category: "社会科学" },
  { word: "社交媒体", description: "社会影响力研究", category: "社会科学" },
  { word: "教育公平", description: "教育资源分配", category: "社会科学" },
  { word: "基因编辑", description: "CRISPR技术与伦理", category: "生物" },
  { word: "食品安全", description: "营养与健康", category: "生物" },
  { word: "城市规划", description: "智慧城市设计", category: "工程" },
  { word: "文学分析", description: "作品与文化研究", category: "人文" },
];

function KeywordsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>(DEFAULT_KEYWORDS);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId) return;
    async function fetchKeywords() {
      setLoading(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategyCode: "AI-S03",
            input: "请基于用户画像生成研究方向关键词推荐",
            context: `对话ID: ${conversationId}`,
          }),
        });
        const data = await res.json();
        const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.keywords) && parsed.keywords.length > 0) {
            setKeywords(parsed.keywords);
          }
        }
      } catch {
        // keep default keywords
      }
      setLoading(false);
    }
    fetchKeywords();
  }, [conversationId]);

  const toggle = (word: string) => {
    const next = new Set(selected);
    if (next.has(word)) next.delete(word);
    else next.add(word);
    setSelected(next);
  };

  const categories = [...new Set(keywords.map((k) => k.category))];
  const referencesUrl = conversationId
    ? `/topic/references?keywords=${[...selected].join(",")}&conversationId=${conversationId}`
    : `/topic/references?keywords=${[...selected].join(",")}`;
  const backUrl = conversationId
    ? `/topic/profile?conversationId=${conversationId}`
    : "/topic/profile?quickStart=1";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-purple/20 border-t-purple rounded-full animate-spin mb-4" />
        <p className="text-text-dim">正在为你生成研究方向...</p>
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

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 text-accent text-xs font-semibold mb-4">
          第 3 步 / 4 · 圈定感兴趣的方向
        </div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-purple/10 flex items-center justify-center text-3xl mx-auto mb-4">
          🏷️
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">选择感兴趣的方向</h1>
        <p className="text-text-dim">
          从下面的关键词中勾选你感兴趣的研究方向，可以多选
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((cat) => {
          const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS["技术"];
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${colors.bg.replace("/10", "")}`} style={{ background: "currentColor" }} />
                <h3 className={`text-sm font-bold ${colors.text} uppercase tracking-wider`}>
                  {cat}
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
            已选 {selected.size} 个方向
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
          onClick={() => router.push(referencesUrl)}
          disabled={selected.size === 0}
          className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-accent/20"
        >
          确认选择（{selected.size} 项），查看相关研究
        </button>
      </div>
    </div>
  );
}

export default function TopicKeywordsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <KeywordsContent />
    </Suspense>
  );
}
