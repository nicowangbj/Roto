const KEY = "roto_topic_draft";
const EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;

export interface TopicDraftKeyword {
  word: string;
  description: string;
  category: string;
}

export interface TopicDraftReference {
  title: string;
  description: string;
  difficulty: string;
  field: string;
}

export interface TopicDraft {
  step: "chat" | "profile" | "keywords" | "references" | "recommend" | "confirm";
  conversationId: string | null;
  keywords: TopicDraftKeyword[];
  selectedKeywords: string[];
  references: TopicDraftReference[];
  selectedRefs: number[];
  topicName: string;
  topicOutput: string;
  topicDuration: string;
  confirmForm: {
    name: string;
    field: string;
    description: string;
    outputFormat: string;
    duration: string;
    weeklyHours: string;
  };
  updatedAt: number;
}

const EMPTY_DRAFT: Omit<TopicDraft, "updatedAt"> = {
  step: "chat",
  conversationId: null,
  keywords: [],
  selectedKeywords: [],
  references: [],
  selectedRefs: [],
  topicName: "",
  topicOutput: "",
  topicDuration: "",
  confirmForm: { name: "", field: "", description: "", outputFormat: "", duration: "", weeklyHours: "" },
};

export function getTopicDraft(): TopicDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as TopicDraft;
    if (Date.now() - draft.updatedAt > EXPIRE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveTopicDraft(patch: Partial<TopicDraft>): void {
  if (typeof window === "undefined") return;
  const current = getTopicDraft() ?? { ...EMPTY_DRAFT, updatedAt: Date.now() };
  const updated: TopicDraft = {
    ...current,
    ...patch,
    confirmForm: { ...current.confirmForm, ...(patch.confirmForm ?? {}) },
    updatedAt: Date.now(),
  };
  localStorage.setItem(KEY, JSON.stringify(updated));
}

export function clearTopicDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
