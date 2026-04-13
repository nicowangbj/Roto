"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Topic {
  name: string;
  reason: string;
  researchPoints: string[];
  outputFormat: string;
  estimatedDuration: string;
}

interface Message {
  role: "tutor" | "user" | "system";
  content: string;
  topicIndex?: number; // links message to a topic card
}

const DEFAULT_TOPICS: Topic[] = [
  {
    name: "社交媒体对高中生学习动机的影响研究",
    reason: "结合你对心理学和社交媒体的兴趣，这个课题容易获取数据且具有实际意义",
    researchPoints: ["问卷设计与数据收集", "相关性分析", "影响因素识别"],
    outputFormat: "研究报告",
    estimatedDuration: "10周",
  },
  {
    name: "校园植被对小气候的调节效应",
    reason: "利用身边资源即可开展研究，适合入门级科研",
    researchPoints: ["温度湿度数据采集", "植被覆盖率统计", "数据对比分析"],
    outputFormat: "实验报告",
    estimatedDuration: "8周",
  },
  {
    name: "AI 写作辅助工具对高中生写作能力的影响",
    reason: "紧贴时代热点，且可以在校园内方便地开展对照实验",
    researchPoints: ["实验设计", "写作质量评估", "学生反馈分析"],
    outputFormat: "研究论文",
    estimatedDuration: "12周",
  },
];

function RecommendContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keywords = searchParams.get("keywords") || "";
  const refs = searchParams.get("refs") || "";
  const conversationId = searchParams.get("conversationId");
  const [topics, setTopics] = useState<Topic[]>(DEFAULT_TOPICS);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const backUrl = conversationId
    ? `/topic/references?keywords=${keywords}&conversationId=${conversationId}`
    : `/topic/references?keywords=${keywords}`;

  // Conversation messages
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "tutor",
      content: "嗨！根据你之前的兴趣和选择，我为你精心挑选了 3 个研究课题。让我逐个为你介绍一下吧！",
    },
    {
      role: "tutor",
      content: "首先是第一个课题——点击下方卡片可以查看详情。你对哪个最感兴趣，或者有什么疑问，都可以语音或文字告诉我。",
      topicIndex: 0,
    },
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!keywords && !refs) return;
    async function fetchRecommendations() {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategyCode: "AI-S05",
            input: `用户选择的关键词：${keywords}\n感兴趣的研究：${refs}`,
          }),
        });
        const data = await res.json();
        const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
            setTopics(parsed.topics);
          }
        }
      } catch {
        // keep default topics
      }
    }
    fetchRecommendations();
  }, [keywords, refs]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const userMsg = inputText.trim();
    setInputText("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg },
      {
        role: "tutor",
        content: "这是个好问题！让我想想... 这个课题的核心价值在于它非常贴近你的日常生活，你可以直接在校园里开展研究。如果你感兴趣，我们可以继续深入聊聊具体怎么做，或者你想先看看其他课题？",
      },
    ]);
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate voice recording start
      setTimeout(() => {
        setIsRecording(false);
        setMessages((prev) => [
          ...prev,
          { role: "user", content: "（语音消息）我想了解一下第二个课题" },
          {
            role: "tutor",
            content: "好的！第二个课题是关于校园植被的研究。这个课题特别适合喜欢动手和户外观察的同学。来看看详情吧——",
            topicIndex: 1,
          },
        ]);
      }, 2000);
    }
  };

  const handleSelectTopic = (topic: Topic) => {
    router.push(
      `/topic/confirm?name=${encodeURIComponent(topic.name)}&output=${encodeURIComponent(topic.outputFormat)}&duration=${encodeURIComponent(topic.estimatedDuration)}`
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Left: Tutor character panel */}
      <div className="hidden lg:flex flex-col w-64 shrink-0">
        <div className="bg-white rounded-2xl border border-border p-5 text-center mb-4">
          <div className="img-placeholder mx-auto mb-3" style={{ width: 120, height: 120, borderRadius: "20px" }}>
            <span className="icon">🧑‍🔬</span>
            <span className="spec">AI导师全身形象 · 120x120</span>
          </div>
          <h3 className="font-bold text-text text-sm">AI 科研导师</h3>
          <p className="text-xs text-text-muted mt-1">正在为你解读课题</p>

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
              <span className="text-xs text-text-muted">点击麦克风与我语音交流</span>
            )}
          </div>
        </div>

        {/* Quick topic nav */}
        <div className="bg-white rounded-2xl border border-border p-4 flex-1">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">推荐课题</h4>
          <div className="space-y-2">
            {topics.map((topic, i) => (
              <button
                key={i}
                onClick={() => setExpandedTopic(expandedTopic === i ? null : i)}
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
            返回上一步
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 text-accent text-xs font-semibold mb-3">
            选题结果 · 请选择一个课题继续创建项目
          </div>
          <h1 className="text-xl font-bold text-text">课题推荐</h1>
          <p className="text-sm text-text-dim">导师正在为你介绍和解读推荐课题，你可以语音或文字提问</p>
        </div>

        {/* Message stream */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg, i) => {
            const topicIndex = typeof msg.topicIndex === "number" ? msg.topicIndex : null;
            const topic = topicIndex !== null ? topics[topicIndex] : null;

            return (
            <div key={i}>
              {msg.role === "tutor" && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-sm">🧑‍🔬</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="bg-white rounded-2xl rounded-tl-md border border-border px-4 py-3 max-w-[85%]">
                      <p className="text-sm text-text-dim leading-relaxed">{msg.content}</p>
                    </div>

                    {/* Inline topic card */}
                    {topicIndex !== null && topic && (
                      <TopicCard
                        topic={topic}
                        index={topicIndex}
                        expanded={expandedTopic === topicIndex}
                        onToggle={() => setExpandedTopic(expandedTopic === topicIndex ? null : topicIndex)}
                        onSelect={() => handleSelectTopic(topic)}
                      />
                    )}
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
          )})}
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
                <span className="text-sm text-rose font-medium">正在录音，点击停止...</span>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="输入你的问题，或点击麦克风语音交流..."
                  className="flex-1 px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="px-5 py-3 bg-accent text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-accent/90 transition-colors"
                >
                  发送
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
}: {
  topic: Topic;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
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
              <h4 className="text-xs font-semibold text-accent mb-1">为什么适合你</h4>
              <p className="text-xs text-text-dim leading-relaxed">{topic.reason}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-text-muted mb-2">研究要点</h4>
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
              就选这个课题！
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TopicRecommendPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <RecommendContent />
    </Suspense>
  );
}
