import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";

interface InboundMessage {
  role: "user" | "assistant";
  content: string;
}

interface ProfileNote {
  category: string;
  summary: string;
}

const MAX_NOTES = 5;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanClause(value: string): string {
  return normalizeWhitespace(value)
    .replace(/^["'“”‘’]+|["'“”‘’.,!?;:，。！？；：]+$/g, "")
    .trim();
}

function sentenceCase(value: string): string {
  const cleaned = cleanClause(value);
  if (!cleaned) return "";
  return cleaned[0].toUpperCase() + cleaned.slice(1);
}

function addNote(
  notes: ProfileNote[],
  category: string,
  summary: string
) {
  const cleaned = sentenceCase(summary);
  if (!cleaned) return;
  if (notes.some((note) => note.summary.toLowerCase() === cleaned.toLowerCase())) {
    return;
  }
  notes.push({ category, summary: cleaned });
}

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanClause(match[1]);
  }
  return null;
}

function extractStrictNotes(messages: InboundMessage[], locale: string): ProfileNote[] {
  const notes: ProfileNote[] = [];
  const userTexts = messages
    .filter((message) => message.role === "user")
    .map((message) => normalizeWhitespace(message.content))
    .filter(Boolean);

  const labels =
    locale === "zh"
      ? {
          interest: "兴趣",
          goal: "目标",
          preference: "偏好",
          time: "时间",
          background: "背景",
        }
      : {
          interest: "Interest",
          goal: "Goal",
          preference: "Preference",
          time: "Time",
          background: "Background",
        };

  for (const text of userTexts) {
    const interest = firstMatch(text, [
      /\b(?:i am|i'm)\s+interested\s+in\s+(.+?)(?:[.!?]|$)/i,
      /\bmy interests?\s+(?:are|include)\s+(.+?)(?:[.!?]|$)/i,
      /我(?:对|对于)(.+?)(?:感兴趣|有兴趣)/,
      /我(?:喜欢|想了解)(.+?)(?:[。！？]|$)/,
    ]);
    if (interest) {
      addNote(
        notes,
        labels.interest,
        locale === "zh" ? `对${interest}感兴趣` : `Interested in ${interest}`
      );
    }

    const want = firstMatch(text, [
      /\bi\s+want\s+to\s+(.+?)(?:[.!?]|$)/i,
      /\bi'd\s+like\s+to\s+(.+?)(?:[.!?]|$)/i,
      /\bi\s+hope\s+to\s+(.+?)(?:[.!?]|$)/i,
      /我想要?(.+?)(?:[。！？]|$)/,
      /我希望(.+?)(?:[。！？]|$)/,
    ]);
    if (want) {
      addNote(
        notes,
        labels.goal,
        locale === "zh" ? `想要${want}` : `Wants to ${want}`
      );
    }

    const preference = firstMatch(text, [
      /\bpreferably\s+(.+?)(?:[.!?]|$)/i,
      /\bi\s+prefer\s+(.+?)(?:[.!?]|$)/i,
      /\bi'd\s+prefer\s+(.+?)(?:[.!?]|$)/i,
      /(?:最好|更希望|偏好)(.+?)(?:[。！？]|$)/,
    ]);
    if (preference) {
      addNote(
        notes,
        labels.preference,
        locale === "zh" ? `偏好${preference}` : `Prefers ${preference}`
      );
    }

    const time = firstMatch(text, [
      /\b(?:i can spend|i have|available time is)\s+(.+?\b(?:hour|hours|week|weeks|day|days).+?)(?:[.!?]|$)/i,
      /(?:每周|每天|一周|一天).{0,20}(?:小时|分钟|天)/,
    ]);
    if (time) addNote(notes, labels.time, time);

    const background = firstMatch(text, [
      /\bi\s+(?:have|know|can already|am able to)\s+(.+?)(?:[.!?]|$)/i,
      /我(?:已经|会|能够|可以)(.+?)(?:[。！？]|$)/,
    ]);
    if (background) addNote(notes, labels.background, background);

    if (notes.length >= MAX_NOTES) break;
  }

  return notes.slice(0, MAX_NOTES);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    messages?: InboundMessage[];
    locale?: string;
  };

  const messages = (body.messages ?? []).filter(
    (m) => m.role === "user" && typeof m.content === "string" && m.content.trim().length > 0
  );

  if (messages.length === 0) {
    return NextResponse.json({ notes: [] });
  }

  const locale = body.locale === "zh" ? "zh" : "en";
  return NextResponse.json({ notes: extractStrictNotes(messages, locale) });
}
