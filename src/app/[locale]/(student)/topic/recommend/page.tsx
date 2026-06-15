"use client";

import { useEffect, useState, useRef, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import RotoAvatar from "@/components/RotoAvatar";
import { getTopicDraft, saveTopicDraft } from "@/lib/topic-draft";

interface Topic {
  name: string;
  reason: string;
  researchPoints: string[];
  field?: string;
  researchField?: string;
  outputFormat: string;
  estimatedDuration: string;
}

interface Message {
  role: "tutor" | "user" | "system";
  content: string;
}

const DEFAULT_TOPICS_ZH: Topic[] = [
  {
    name: "社交媒体对高中生学习动机的影响研究",
    reason: "结合你对心理学和社交媒体的兴趣，这个课题容易获取数据且具有实际意义",
    researchPoints: ["问卷设计与数据收集", "相关性分析", "影响因素识别"],
    field: "心理学",
    outputFormat: "研究报告",
    estimatedDuration: "10周",
  },
  {
    name: "校园植被对小气候的调节效应",
    reason: "利用身边资源即可开展研究，适合入门级科研",
    researchPoints: ["温度湿度数据采集", "植被覆盖率统计", "数据对比分析"],
    field: "环境科学",
    outputFormat: "实验报告",
    estimatedDuration: "8周",
  },
  {
    name: "AI 写作辅助工具对高中生写作能力的影响",
    reason: "紧贴时代热点，且可以在校园内方便地开展对照实验",
    researchPoints: ["实验设计", "写作质量评估", "学生反馈分析"],
    field: "教育技术",
    outputFormat: "研究论文",
    estimatedDuration: "12周",
  },
];

const DEFAULT_TOPICS_EN: Topic[] = [
  {
    name: "How Social Media Affects High School Students' Learning Motivation",
    reason: "This topic connects psychology and social media, while still being practical for school-based survey research.",
    researchPoints: ["Survey design and data collection", "Correlation analysis", "Identifying influence factors"],
    field: "Psychology",
    outputFormat: "Research report",
    estimatedDuration: "10 weeks",
  },
  {
    name: "How Campus Vegetation Influences Local Microclimate",
    reason: "This topic can be studied with accessible school resources and is suitable for beginner research.",
    researchPoints: ["Temperature and humidity data collection", "Vegetation coverage observation", "Data comparison and analysis"],
    field: "Environmental Science",
    outputFormat: "Experimental report",
    estimatedDuration: "8 weeks",
  },
  {
    name: "The Impact of AI Writing Tools on High School Students' Writing Ability",
    reason: "This is a timely topic that can be explored through a small classroom or school-based comparison study.",
    researchPoints: ["Experimental design", "Writing quality assessment", "Student feedback analysis"],
    field: "Education Technology",
    outputFormat: "Research paper",
    estimatedDuration: "12 weeks",
  },
];

function getDefaultTopics(locale: string) {
  return locale === "zh" ? DEFAULT_TOPICS_ZH : DEFAULT_TOPICS_EN;
}

function containsCjk(text: string) {
  return /[\u3400-\u9fff]/.test(text);
}

function formatForLocale(value: string, locale: string) {
  if (locale === "zh") return value;
  return value
    .replace(/研究报告/g, "Research report")
    .replace(/实验报告/g, "Experimental report")
    .replace(/研究论文/g, "Research paper")
    .replace(/论文/g, "Research paper")
    .replace(/周/g, " weeks");
}

function normalizeOutputFormat(value: string, locale: string) {
  const lower = value.toLowerCase();
  if (locale === "zh") {
    if (value.includes("实验")) return "实验报告";
    if (value.includes("调研") || value.includes("问卷") || value.includes("案例")) return "调研报告";
    if (value.includes("论文")) return "论文";
    return "研究报告";
  }
  if (lower.includes("experiment")) return "Experimental report";
  if (lower.includes("survey") || lower.includes("case")) return "Survey report";
  if (lower.includes("paper")) return "Academic paper";
  return "Research report";
}

function normalizeDuration(value: string, locale: string) {
  const numbers = value.match(/\d+/g)?.map(Number) ?? [];
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 12;
  const isMonth = /month|月/i.test(value);
  const weeks = isMonth ? maxNumber * 4 : maxNumber;
  const options = [6, 8, 10, 12, 16];
  const closest = options.reduce((best, option) =>
    Math.abs(option - weeks) < Math.abs(best - weeks) ? option : best
  );
  return locale === "zh" ? `${closest}周` : `${closest} weeks`;
}

function inferField(topic: Topic, locale: string, fallbackField: string) {
  const explicitField = topic.field || topic.researchField;
  if (explicitField) return formatForLocale(explicitField, locale);

  const text = `${topic.name} ${topic.reason} ${topic.researchPoints.join(" ")}`.toLowerCase();
  if (/price|pricing|market|business|econom|bertrand|cournot|coffee|competition/.test(text)) {
    return locale === "zh" ? "经济学" : "Economics";
  }
  if (/streaming|media|social/.test(text)) return locale === "zh" ? "传媒研究" : "Media Studies";
  if (/environment|sustainable|climate|green/.test(text)) return locale === "zh" ? "环境科学" : "Environmental Science";
  if (/ai|writing|education|learning/.test(text)) return locale === "zh" ? "教育技术" : "Education Technology";
  return fallbackField || (locale === "zh" ? "跨学科研究" : "Interdisciplinary Research");
}

function normalizeTopic(raw: Topic, locale: string, fallbackField: string): Topic | null {
  const topic = {
    name: raw.name || "",
    reason: raw.reason || "",
    researchPoints: Array.isArray(raw.researchPoints) ? raw.researchPoints : [],
    field: inferField(raw, locale, fallbackField),
    outputFormat: normalizeOutputFormat(raw.outputFormat || "", locale),
    estimatedDuration: normalizeDuration(raw.estimatedDuration || "", locale),
  };

  if (
    locale !== "zh" &&
    [topic.name, topic.reason, ...topic.researchPoints].some((text) => containsCjk(text))
  ) {
    return null;
  }

  return topic;
}

function extractReadableReply(reply: string, locale: string): string {
  const trimmed = reply.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return reply;

  try {
    const parsed = JSON.parse(trimmed);
    const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
    if (topics.length === 0) return reply;

    const first = topics[0] as Partial<Topic>;
    const title = typeof first.name === "string" ? first.name : "";
    const reason = typeof first.reason === "string" ? first.reason : "";
    const points = Array.isArray(first.researchPoints)
      ? first.researchPoints.filter((point): point is string => typeof point === "string")
      : [];

    if (locale === "zh") {
      return [
        title ? `可以，最适合改造的是「${title}」。` : "可以，这个想法可以和当前推荐课题结合。",
        reason,
        points.length > 0 ? `具体可以从这些角度推进：${points.slice(0, 3).join("；")}。` : "",
      ].filter(Boolean).join("\n\n");
    }

    return [
      title ? `Yes. The strongest fit is "${title}".` : "Yes, that idea can connect to the current topic set.",
      reason,
      points.length > 0 ? `A practical way to shape it would be: ${points.slice(0, 3).join("; ")}.` : "",
    ].filter(Boolean).join("\n\n");
  } catch {
    return reply;
  }
}

function RecommendContent() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("topicRecommend");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const keywords = searchParams.get("keywords") || "";
  const refs = searchParams.get("refs") || "";
  const conversationId = searchParams.get("conversationId");
  const [topics, setTopics] = useState<Topic[]>(() => getDefaultTopics(locale));
  const [expandedTopic, setExpandedTopic] = useState<number | null>(0);
  const [visibleTopicCount, setVisibleTopicCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const topicRefs = useRef<(HTMLDivElement | null)[]>([]);
  const draft = typeof window !== "undefined" ? getTopicDraft() : null;
  const selectedReferenceFields =
    draft?.selectedRefs
      .map((index) => draft.references[index]?.field)
      .filter((field): field is string => Boolean(field)) ?? [];
  const fallbackField = selectedReferenceFields[0] || "";
  const keywordsParam = encodeURIComponent(keywords);
  const backUrl = conversationId
    ? `/${locale}/topic/references?keywords=${keywordsParam}&conversationId=${conversationId}`
    : `/${locale}/topic/references?keywords=${keywordsParam}`;

  // Conversation messages — only text bubbles, not tied to any topic card.
  const [messages, setMessages] = useState<Message[]>([]);
  const [tutorTyping, setTutorTyping] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const initialStagedRef = useRef(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(Boolean(keywords || refs));

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Push a tutor message after showing a typing indicator for `thinkingMs`.
  const pushTutorStaged = (content: string, thinkingMs = 900) => {
    setTutorTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "tutor", content }]);
        setTutorTyping(false);
        resolve();
      }, thinkingMs);
    });
  };

  // Stagger the two opening tutor messages so the conversation feels live.
  useEffect(() => {
    if (initialStagedRef.current) return;
    if (recommendationsLoading) return;
    initialStagedRef.current = true;
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;
      await pushTutorStaged(t("initialMsg1", { count: topics.length }), 800);
      if (cancelled) return;
      await new Promise((r) => setTimeout(r, 500));
      if (cancelled) return;
      await pushTutorStaged(t("initialMsg2"), 1100);
      if (cancelled) return;
      setVisibleTopicCount(1);
      setExpandedTopic(0);

      for (let i = 1; i < topics.length; i += 1) {
        await new Promise((r) => setTimeout(r, 650));
        if (cancelled) return;
        setVisibleTopicCount(i + 1);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [recommendationsLoading, t, topics.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tutorTyping]);

  useEffect(() => {
    if (!keywords && !refs) return;
    async function fetchRecommendations() {
      setRecommendationsLoading(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-locale": locale },
          body: JSON.stringify({
            strategyCode: "AI-S05",
            input: `Selected keywords: ${keywords}\nResearch of interest: ${refs}`,
            conversationId,
            context: locale === "zh"
              ? "基于用户对话记录、画像、已选关键词和已选参考案例生成具体课题推荐。所有 JSON 字符串值必须使用简体中文。"
              : "Generate specific topic recommendations based on the user's conversation transcript, profile, selected keywords, and selected reference cases. Every JSON string value must be written in natural English only.",
          }),
        });
        const data = await res.json();
        const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
            const normalizedTopics = parsed.topics
              .map((topic: Topic) => normalizeTopic(topic, locale, fallbackField))
              .filter((topic: Topic | null): topic is Topic => Boolean(topic));
            if (normalizedTopics.length > 0) {
              setTopics(normalizedTopics);
            }
          }
        }
      } catch {
        // keep default topics
      } finally {
        setRecommendationsLoading(false);
      }
    }
    fetchRecommendations();
  }, [keywords, refs, conversationId, locale, fallbackField]);

  const handleSend = async () => {
    if (!inputText.trim() || chatLoading) return;
    const userMsg = inputText.trim();
    setInputText("");

    const updatedMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(updatedMessages);
    setChatLoading(true);
    setTutorTyping(true);

    try {
      const topicContext = topics.map((t, i) =>
        [
          `#${i + 1} ${t.name}`,
          `Reason: ${t.reason}`,
          `Research points: ${t.researchPoints.join("; ")}`,
          `Output: ${t.outputFormat}`,
          `Duration: ${t.estimatedDuration}`,
        ].join("\n")
      ).join("\n");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          strategyCode: "AI-S05_CHAT",
          message: userMsg,
          context: `Recommended topics currently shown on screen:\n${topicContext}`,
          conversationId: conversationIdRef.current,
        }),
      });
      const data = await res.json();
      if (data.conversationId) conversationIdRef.current = data.conversationId;
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "tutor", content: extractReadableReply(data.reply, locale) }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "tutor", content: t("initialMsg1", { count: topics.length }) }]);
    } finally {
      setTutorTyping(false);
      setChatLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate voice recording start
      setTimeout(async () => {
        setIsRecording(false);
        setMessages((prev) => [
          ...prev,
          { role: "user", content: t("voiceMockUser") },
        ]);
        await new Promise((r) => setTimeout(r, 400));
        await pushTutorStaged(t("voiceMockReply"), 900);
        if (topics[1]) {
          setExpandedTopic(1);
          topicRefs.current[1]?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 2000);
    }
  };

  const handleFocusTopic = (i: number) => {
    setExpandedTopic(expandedTopic === i ? null : i);
    topicRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const topicListRender = useMemo(() => topics.slice(0, visibleTopicCount), [topics, visibleTopicCount]);

  const handleSelectTopic = (topic: Topic) => {
    const description = [
      topic.reason,
      topic.researchPoints.length > 0
        ? `${locale === "zh" ? "研究要点" : "Research points"}: ${topic.researchPoints.join(", ")}`
        : "",
    ].filter(Boolean).join("\n");

    saveTopicDraft({
      step: "confirm",
      topicName: topic.name,
      topicOutput: topic.outputFormat,
      topicDuration: topic.estimatedDuration,
      confirmForm: {
        name: topic.name,
        field: topic.field || fallbackField,
        description,
        outputFormat: topic.outputFormat,
        duration: topic.estimatedDuration,
        weeklyHours: "",
      },
    });
    router.push(
      `/${locale}/topic/confirm?name=${encodeURIComponent(topic.name)}&field=${encodeURIComponent(topic.field || fallbackField)}&output=${encodeURIComponent(topic.outputFormat)}&duration=${encodeURIComponent(topic.estimatedDuration)}&description=${encodeURIComponent(description)}`
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Left: Tutor character panel */}
      <div className="hidden lg:flex flex-col w-64 shrink-0">
        <div className="bg-white rounded-2xl border border-border p-5 text-center mb-4 roto-panel">
          <div className="flex justify-center mb-3">
            <RotoAvatar size="sm" scene="welcome" />
          </div>
          <h3 className="font-bold text-text text-sm">{t("tutorTitle")}</h3>
          <p className="text-xs text-text-muted mt-1">{t("tutorStatus")}</p>

          {/* Voice wave animation when speaking */}
          <div className="flex items-center justify-center gap-1 mt-3 h-6">
            {isRecording ? (
              <>
                <div className="w-1 bg-accent rounded-full animate-pulse" style={{ height: 12, animationDelay: "0ms" }} />
                <div className="w-1 bg-accent rounded-full animate-pulse" style={{ height: 20, animationDelay: "150ms" }} />
                <div className="w-1 bg-accent rounded-full animate-pulse" style={{ height: 16, animationDelay: "300ms" }} />
                <div className="w-1 bg-accent rounded-full animate-pulse" style={{ height: 24, animationDelay: "100ms" }} />
                <div className="w-1 bg-accent rounded-full animate-pulse" style={{ height: 14, animationDelay: "250ms" }} />
              </>
            ) : (
              <span className="text-xs text-text-muted">{t("voiceHint")}</span>
            )}
          </div>
        </div>

        {/* Quick topic nav */}
        <div className="bg-white rounded-2xl border border-border p-4 flex-1 roto-panel">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{t("topicsLabel")}</h4>
          <div className="space-y-2">
            {topicListRender.map((topic, i) => (
              <button
                key={i}
                onClick={() => handleFocusTopic(i)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all ${
                  expandedTopic === i
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "hover:bg-surface2 text-text-dim"
                }`}
              >
                <span className="font-medium">#{i + 1}</span>{" "}
                <span className="line-clamp-1">{topic.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Conversation + topic cards */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-3">
          <button
            onClick={() => router.push(backUrl)}
            className="text-text-dim hover:text-accent text-sm mb-3 inline-flex items-center gap-1 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("back")}
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 text-accent text-xs font-semibold mb-3">
            {t("subtitle")}
          </div>
          <h1 className="text-xl font-bold text-text">{t("title")}</h1>
          <p className="text-sm text-text-dim">{t("subtitle2")}</p>
        </div>

        {/* Message stream */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "tutor" && (
                <div className="flex gap-3">
                  <div className="shrink-0 mt-1">
                    <RotoAvatar size="xxs" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-2xl rounded-tl-md border border-border px-4 py-3 max-w-[85%]">
                      <p className="whitespace-pre-line text-sm text-text-dim leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </div>
              )}

              {msg.role === "user" && (
                <div className="flex justify-end">
                  <div className="bg-accent text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-[75%]">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Recommended topic cards are revealed one by one after mentor intro. */}
          <div className="space-y-3 pt-2">
            {topicListRender.map((topic, i) => (
              <div
                key={`${i}-${topic.name}`}
                ref={(el) => {
                  topicRefs.current[i] = el;
                }}
              >
                <TopicCard
                  topic={topic}
                  index={i}
                  expanded={expandedTopic === i}
                  onToggle={() => setExpandedTopic(expandedTopic === i ? null : i)}
                  onSelect={() => handleSelectTopic(topic)}
                  whySuitable={t("whySuitable")}
                  researchPoints={t("researchPoints")}
                  selectLabel={t("select")}
                />
              </div>
            ))}
          </div>
          {(chatLoading || tutorTyping) && (
            <div className="flex gap-3">
              <div className="shrink-0 mt-1"><RotoAvatar size="xxs" /></div>
              <div className="bg-white rounded-2xl rounded-tl-md border border-border px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar with voice button */}
        <div className="border-t border-border pt-4">
          <div className="flex gap-3 items-center">
            {/* Voice button */}
            <button
              onClick={handleVoiceToggle}
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                isRecording
                  ? "bg-rose text-white shadow-lg shadow-rose/30 animate-pulse"
                  : "bg-surface2 text-text-dim hover:bg-accent/10 hover:text-accent"
              }`}
            >
              {isRecording ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="4" y="4" width="12" height="12" rx="2" fill="currentColor" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 1a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" fill="currentColor" />
                  <path d="M5 9a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M10 15v4M7 19h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </button>

            {isRecording ? (
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-rose/5 border border-rose/20 rounded-xl">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-3 bg-rose rounded-full animate-pulse" />
                  <div className="w-1.5 h-5 bg-rose rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-4 bg-rose rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                  <div className="w-1.5 h-6 bg-rose rounded-full animate-pulse" style={{ animationDelay: "100ms" }} />
                  <div className="w-1.5 h-3 bg-rose rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                </div>
                <span className="text-sm text-rose font-medium">{t("recording")}</span>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder={t("placeholder")}
                  className="flex-1 px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || chatLoading}
                  className="px-5 py-3 bg-accent text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-accent/90 transition-colors"
                >
                  {tCommon("send")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicCard({
  topic,
  index,
  expanded,
  onToggle,
  onSelect,
  whySuitable,
  researchPoints,
  selectLabel,
}: {
  topic: Topic;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  whySuitable: string;
  researchPoints: string;
  selectLabel: string;
}) {
  const CARD_COLORS = [
    { gradient: "from-accent to-purple", badge: "bg-accent/10 text-accent" },
    { gradient: "from-green to-cyan", badge: "bg-green/10 text-green" },
    { gradient: "from-amber to-rose", badge: "bg-amber/10 text-amber" },
  ];
  const colors = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div className="max-w-[90%] bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className={`h-1.5 bg-gradient-to-r ${colors.gradient}`} />
      <div className="p-4">
        <button onClick={onToggle} className="w-full text-left">
          <div className="flex items-start gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${colors.badge} shrink-0 mt-0.5`}>
              #{index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-text text-sm">{topic.name}</h3>
              <div className="flex gap-3 mt-1.5">
                <span className="text-xs text-cyan">{topic.outputFormat}</span>
                <span className="text-xs text-amber">{topic.estimatedDuration}</span>
              </div>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              className={`text-text-muted transition-transform shrink-0 mt-1 ${expanded ? "rotate-180" : ""}`}
            >
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="bg-accent/5 rounded-xl p-3">
              <h4 className="text-xs font-semibold text-accent mb-1">{whySuitable}</h4>
              <p className="text-xs text-text-dim leading-relaxed">{topic.reason}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-text-muted mb-2">{researchPoints}</h4>
              <div className="space-y-1.5">
                {topic.researchPoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-xs text-text-dim">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onSelect}
              className="w-full py-2.5 bg-green hover:bg-green/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-green/20"
            >
              {selectLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TopicRecommendPage() {
  const tCommon = useTranslations("common");
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">{tCommon("loading")}</div></div>}>
      <RecommendContent />
    </Suspense>
  );
}
