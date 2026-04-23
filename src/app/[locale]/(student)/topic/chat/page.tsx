"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import ChatWindow from "@/components/ChatWindow";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ProfileNote {
  category: string;
  summary: string;
}

export default function TopicChatPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("topicChat");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notes, setNotes] = useState<ProfileNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignatureRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerateProfile = async () => {
    if (!conversationId) return;
    router.push(`/${locale}/topic/profile?conversationId=${conversationId}`);
  };

  const handleQuickStart = () => {
    router.push(`/${locale}/topic/profile?quickStart=1`);
  };

  // Debounced profile-note generation: fires ~2.5s after the last chat update,
  // skips when user messages haven't changed since the last run.
  useEffect(() => {
    const userMessages = messages.filter(
      (m) => m.role === "user" && m.content.trim().length > 0
    );
    if (userMessages.length === 0) return;

    const signature = userMessages.map((m) => m.content.trim()).join("\n");
    if (signature === lastSignatureRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setNotesLoading(true);
      try {
        const res = await fetch("/api/conversations/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: userMessages, locale }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { notes?: ProfileNote[] };
        if (controller.signal.aborted) return;
        if (Array.isArray(data.notes)) {
          setNotes(data.notes);
          lastSignatureRef.current = signature;
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error(err);
      } finally {
        if (!controller.signal.aborted) setNotesLoading(false);
      }
    }, 2500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [messages, locale]);

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Left: AI tutor character + profile notes */}
      <div className="hidden lg:flex flex-col w-72 shrink-0">
        <div className="bg-white rounded-2xl border border-border p-6 text-center mb-4 rota-panel">
          <div className="flex justify-center mb-3">
            <Image src="/rota-think.png" alt="Rota" width={120} height={120} className="object-contain" />
          </div>
          <h3 className="font-bold text-text">{t("tutorTitle")}</h3>
          <p className="text-xs text-text-muted mt-1">{t("tutorStatus")}</p>
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-border p-5 overflow-hidden rota-panel flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {t("dialogNotes")}
            </h4>
            {notesLoading ? (
              <span className="flex items-center gap-1 text-[10px] text-accent">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse [animation-delay:0.3s]" />
              </span>
            ) : notes.length > 0 ? (
              <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                {notes.length}
              </span>
            ) : null}
          </div>
          {notes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center px-2">
              <p className="text-xs text-text-muted leading-relaxed">
                {t("notesEmpty")}
              </p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1">
              {notes.map((note, idx) => (
                <li
                  key={`${idx}-${note.summary.slice(0, 8)}`}
                  className="relative pl-3 border-l-2 border-accent/40 leading-relaxed"
                >
                  {note.category && (
                    <span className="block text-[10px] font-semibold text-accent/80 uppercase tracking-wider mb-1">
                      {note.category}
                    </span>
                  )}
                  <span className="block text-xs text-text">
                    {note.summary}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 pt-3 border-t border-border/60 text-[10px] text-text-muted leading-relaxed">
            {t("notesFootnote")}
          </p>
        </div>
      </div>

      {/* Right: Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 text-accent text-xs font-semibold mb-3">
            {t("step", { current: 1, total: 4 })}
          </div>
          <h1 className="text-xl font-bold text-text">{t("title")}</h1>
          <p className="text-sm text-text-dim">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-border p-5">
          <ChatWindow
            strategyCode="AI-S01"
            placeholder={t("placeholder")}
            initialMessages={[
              {
                role: "assistant",
                content: t("initialMessage"),
              },
            ]}
            onConversationUpdate={(id, updated) => {
              setConversationId(id);
              if (updated) setMessages(updated);
            }}
          />
        </div>

        <div className="pt-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGenerateProfile}
              disabled={!conversationId}
              className="flex-1 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-accent/20"
            >
              {t("generateProfile")}
            </button>
            <button
              onClick={handleQuickStart}
              className="sm:w-auto px-6 py-3.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
            >
              {t("useDefault")}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-3">
            {t("defaultHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
