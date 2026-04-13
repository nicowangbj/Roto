"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  strategyCode: string;
  projectId?: string;
  context?: string;
  placeholder?: string;
  onConversationUpdate?: (conversationId: string, messages: Message[]) => void;
  initialMessages?: Message[];
}

export default function ChatWindow({
  strategyCode,
  projectId,
  context,
  placeholder = "输入你的回复...",
  onConversationUpdate,
  initialMessages = [],
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");

    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: userMsg,
          strategyCode,
          projectId,
          context,
        }),
      });
      const data = await res.json();
      setConversationId(data.conversationId);
      const updated = [...newMessages, { role: "assistant" as const, content: data.reply }];
      setMessages(updated);
      onConversationUpdate?.(data.conversationId, updated);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "抱歉，发生了网络错误。请稍后重试。" },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 ${
                msg.role === "user" ? "chat-user" : "chat-assistant"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px]">🧑‍🏫</span>
                  <span className="text-xs font-semibold text-accent">AI 导师</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="chat-assistant px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px]">🧑‍🏫</span>
                <span className="text-xs font-semibold text-accent">AI 导师</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-accent text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-accent/90 transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
