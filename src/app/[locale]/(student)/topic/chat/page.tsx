"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import ChatWindow from "@/components/ChatWindow";
import RotoAvatar from "@/components/RotoAvatar";
import { clearTopicDraft, getTopicDraft, saveTopicDraft } from "@/lib/topic-draft";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ProfileNote {
  category: string;
  summary: string;
}

function TopicChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("topicChat");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notes, setNotes] = useState<ProfileNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignatureRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  // Auto-resume: if there's a draft in progress, jump to where the user left off.
  useEffect(() => {
    if (searchParams.get("fresh") === "1") {
      clearTopicDraft();
      return;
    }
    const draft = getTopicDraft();
    if (!draft || draft.step === "chat") return;
    const cid = draft.conversationId ?? "";
    const kw = draft.selectedKeywords.join(",");
    const rf = encodeURIComponent(
      draft.selectedRefs.map((i) => draft.references[i]?.title ?? "").filter(Boolean).join(",")
    );
    const urls: Record<string, string> = {
      profile: `/${locale}/topic/profile?conversationId=${cid}`,
      keywords: `/${locale}/topic/keywords?conversationId=${cid}`,
      references: `/${locale}/topic/references?keywords=${kw}&conversationId=${cid}`,
      recommend: `/${locale}/topic/recommend?keywords=${kw}&refs=${rf}&conversationId=${cid}`,
      confirm: `/${locale}/topic/confirm?name=${encodeURIComponent(draft.confirmForm.name || draft.topicName)}&field=${encodeURIComponent(draft.confirmForm.field)}&output=${encodeURIComponent(draft.confirmForm.outputFormat || draft.topicOutput)}&duration=${encodeURIComponent(draft.confirmForm.duration || draft.topicDuration)}&description=${encodeURIComponent(draft.confirmForm.description)}&path=${draft.confirmForm.name ? "no_topic" : "has_topic"}`,
    };
    const url = urls[draft.step];
    if (url) router.replace(url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateProfile = async () => {
    if (!conversationId) return;
    saveTopicDraft({ step: "profile", conversationId });
    router.push(`/${locale}/topic/profile?conversationId=${conversationId}`);
  };

  const handleQuickStart = () => {
    router.push(`/${locale}/topic/profile?quickStart=1`);
  };

  const userMessages = messages.filter(
    (message) => message.role === "user" && message.content.trim().length > 0
  );
  const totalUserInputLength = userMessages.reduce((sum, message) => sum + message.content.trim().length, 0);
  const canGenerateProfile = Boolean(conversationId) && (
    notes.length >= 3 ||
    userMessages.length >= 3 ||
    totalUserInputLength >= 140
  );
  const chatGuardrails = locale === "zh"
    ? [
        "当前是信息收集聊天阶段，不要直接生成或展示用户画像报告。",
        "不要输出带有“兴趣/技能/时间/偏好/动机”等栏目式画像总结。",
        "每次只追问 1-2 个自然问题，尽量简短。",
        "当你认为信息足够时，只需提示学生点击页面下方的“生成画像报告”按钮进入下一步，不要在聊天中写出画像内容。",
      ].join("\n")
    : [
        "This is the information-gathering chat stage. Do not directly generate or display a user profile report.",
        "Do not output profile-style sections such as Interests, Skills, Time, Preferences, or Motivation.",
        "Ask only 1-2 natural follow-up questions at a time and keep replies concise.",
        "When you have enough information, simply guide the student to click the profile-generation button below to continue. Do not write the profile in the chat.",
      ].join("\n");

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
        <div className="bg-white rounded-2xl border border-border p-6 text-center mb-4 roto-panel">
          <div className="flex justify-center mb-3">
            <RotoAvatar size="xs" className="mx-auto" />
          </div>
          <h3 className="font-bold text-text">{t("tutorTitle")}</h3>
          <p className="text-xs text-text-muted mt-1">{t("tutorStatus")}</p>
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-border p-5 overflow-hidden roto-panel flex flex-col min-h-0">
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
            context={chatGuardrails}
            placeholder={t("placeholder")}
            initialMessages={[
              {
                role: "assistant",
                content: t("initialMessage"),
              },
            ]}
            onConversationUpdate={(id, updated) => {
              setConversationId(id);
              saveTopicDraft({ step: "chat", conversationId: id });
              if (updated) setMessages(updated);
            }}
          />
        </div>

        <div className="pt-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {canGenerateProfile ? (
              <button
                onClick={handleGenerateProfile}
                className="flex-1 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
              >
                {t("generateProfile")}
              </button>
            ) : (
              <div className="flex-1 rounded-xl border border-dashed border-border bg-white/70 px-4 py-3 text-sm text-text-muted">
                {t("keepChattingHint")}
              </div>
            )}
            <button
              onClick={handleQuickStart}
              className="sm:w-auto px-6 py-3.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
            >
              {t("useDefault")}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-3">
            {canGenerateProfile ? t("readyHint") : t("defaultHint")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TopicChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">...</div></div>}>
      <TopicChatContent />
    </Suspense>
  );
}
