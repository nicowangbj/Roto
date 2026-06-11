import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { generateWithAI } from "@/lib/gemini";

interface InboundMessage {
  role: "user" | "assistant";
  content: string;
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

  const transcript = messages
    .map((m, i) => `[${i + 1}] ${m.content.trim()}`)
    .join("\n");

  const input =
    locale === "zh"
      ? `以下是学生在对话中说过的内容，按时间顺序：\n\n${transcript}`
      : `Here is what the student has said in the conversation, in order:\n\n${transcript}`;

  try {
    const raw = (await generateWithAI("AI-S25", input, undefined, locale)).trim();

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) {
      return NextResponse.json({ notes: [] });
    }
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
      notes?: { category?: string; summary?: string }[];
    };

    const notes = (parsed.notes ?? [])
      .filter((n) => n && typeof n.summary === "string" && n.summary.trim().length > 0)
      .slice(0, 5)
      .map((n) => ({
        category: (n.category ?? "").trim(),
        summary: n.summary!.trim(),
      }));

    return NextResponse.json({ notes });
  } catch (err) {
    console.error("notes generation failed", err);
    return NextResponse.json({ notes: [] });
  }
}
