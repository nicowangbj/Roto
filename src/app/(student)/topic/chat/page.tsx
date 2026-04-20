"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import RotaAvatar from "@/components/RotaAvatar";

export default function TopicChatPage() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleGenerateProfile = async () => {
    if (!conversationId) return;
    router.push(`/topic/profile?conversationId=${conversationId}`);
  };

  const handleQuickStart = () => {
    router.push("/topic/profile?quickStart=1");
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Left: AI tutor character + whiteboard area */}
      <div className="hidden lg:flex flex-col w-72 shrink-0">
        <div className="bg-white rounded-2xl border border-border p-6 text-center mb-4 rota-panel">
          <div className="flex justify-center mb-3">
            <RotaAvatar size="xs" className="mx-auto" />
          </div>
          <h3 className="font-bold text-text">Rota 科研导师</h3>
          <p className="text-xs text-text-muted mt-1">正在了解你的兴趣和能力</p>
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-border p-5 overflow-hidden rota-panel">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">对话要点</h4>
          <div className="img-placeholder" style={{ width: "100%", height: 200 }}>
            <span className="spec">白板区域 · 实时记录对话关键信息 · 待设计</span>
          </div>
        </div>
      </div>

      {/* Right: Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 text-accent text-xs font-semibold mb-3">
            第 1 步 / 4 · 了解你自己
          </div>
          <h1 className="text-xl font-bold text-text">与 AI 导师对话</h1>
          <p className="text-sm text-text-dim">
            导师会通过对话了解你的兴趣、能力和时间安排，帮你找到合适的研究课题
          </p>
        </div>

        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-border p-5">
          <ChatWindow
            strategyCode="AI-S01"
            placeholder="和导师聊聊你感兴趣的事情..."
            initialMessages={[
              {
                role: "assistant",
                content:
                  "你好！我是你的科研导师。很高兴认识你！\n\n在帮你找到适合的研究课题之前，我想先了解一下你。能告诉我你平时最喜欢做什么，或者对哪些领域比较感兴趣吗？",
              },
            ]}
            onConversationUpdate={(id) => setConversationId(id)}
          />
        </div>

        <div className="pt-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGenerateProfile}
              disabled={!conversationId}
              className="flex-1 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-accent/20"
            >
              聊够了，生成我的画像报告
            </button>
            <button
              onClick={handleQuickStart}
              className="sm:w-auto px-6 py-3.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
            >
              先用默认画像快速开始
            </button>
          </div>
          <p className="text-xs text-text-muted mt-3">
            如果你只是想先体验完整流程，可以直接使用默认画像继续，后面仍然可以再补充信息。
          </p>
        </div>
      </div>
    </div>
  );
}
