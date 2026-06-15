"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";

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

function splitAssistantReply(reply: string): string[] {
  const normalized = reply.trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  const maxLength = 260;

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLength) {
      chunks.push(paragraph);
      continue;
    }

    const sentences = paragraph.match(/[^.!?。！？]+[.!?。！？]?/g) ?? [paragraph];
    let current = "";

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if (current && `${current} ${trimmed}`.length > maxLength) {
        chunks.push(current);
        current = trimmed;
      } else {
        current = current ? `${current} ${trimmed}` : trimmed;
      }
    }

    if (current) chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [normalized];
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={index}
              href={linkMatch[2]}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline underline-offset-2"
            >
              {linkMatch[1]}
            </a>
          );
        }

        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index} className="font-semibold text-text">{part.slice(2, -2)}</strong>;
        }

        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={index} className="italic">{part.slice(1, -1)}</em>;
        }

        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={index} className="rounded-md bg-surface2 px-1.5 py-0.5 text-[0.85em] text-text">
              {part.slice(1, -1)}
            </code>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`list-${elements.length}`} className="my-2 list-disc space-y-1 pl-5">
        {listItems.map((item, index) => (
          <li key={index}><InlineMarkdown text={item} /></li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);

    if (unordered || ordered) {
      listItems.push((unordered?.[1] || ordered?.[1] || "").trim());
      return;
    }

    flushList();

    if (!line.trim()) {
      elements.push(<br key={`br-${index}`} />);
      return;
    }

    elements.push(
      <p key={`p-${index}`} className="mb-2 last:mb-0">
        <InlineMarkdown text={line} />
      </p>
    );
  });

  flushList();

  return <>{elements}</>;
}

export default function ChatWindow({
  strategyCode,
  projectId,
  context,
  placeholder,
  onConversationUpdate,
  initialMessages = [],
}: ChatWindowProps) {
  const t = useTranslations("chat");
  const locale = useLocale();
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
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          conversationId,
          message: userMsg,
          strategyCode,
          projectId,
          context,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chat request failed");

      setConversationId(data.conversationId);
      const replyChunks = splitAssistantReply(String(data.reply ?? ""));
      let updated = newMessages;

      for (let i = 0; i < replyChunks.length; i += 1) {
        if (i > 0) await wait(520);
        updated = [...updated, { role: "assistant" as const, content: replyChunks[i] }];
        setMessages(updated);
      }

      onConversationUpdate?.(data.conversationId, updated);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: t("networkError") },
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
                  <span className="relative w-6 h-6 overflow-hidden rounded-full border border-white bg-brand-cloud/80 shrink-0">
                    <Image
                      src="/roto-ip.png"
                      alt="Roto"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </span>
                  <span className="text-xs font-semibold text-accent">{t("mentorLabel")}</span>
                </div>
              )}
              <div className="text-sm leading-relaxed">
                <MessageContent content={msg.content} />
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="chat-assistant px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="relative w-6 h-6 overflow-hidden rounded-full border border-white bg-brand-cloud/80 shrink-0">
                  <Image
                    src="/roto-ip.png"
                    alt="Roto"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </span>
                <span className="text-xs font-semibold text-accent">{t("mentorLabel")}</span>
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
            placeholder={placeholder ?? t("placeholder")}
            className="flex-1 px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-accent text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-accent/90 transition-colors"
          >
            {t("send")}
          </button>
        </div>
      </div>
    </div>
  );
}
