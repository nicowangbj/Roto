import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSessionUser } from "@/lib/session-user";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL = "gemini-2.0-flash-lite";

interface InboundMessage {
  role: "user" | "assistant";
  content: string;
}

const PROMPT_ZH = `你在帮一位科研导师把学生的自述内容压成 3-5 条"画像要点"。每条要点应该是对学生兴趣、能力、时间或研究偏好的概括判断，而不是学生原话。
要求：
- 每条 one sentence，最多 30 字，描述性、具体
- 尽量覆盖不同维度（兴趣方向 / 已有技能 / 时间精力 / 研究偏好 / 动机）
- 内容不足以判断时，就少返回几条，宁缺毋滥
- 不要使用"学生说"之类引述句式，直接写结论

只返回 JSON，不要其他文字：
{"notes":[{"category":"兴趣","summary":"对人工智能和心理学交叉领域感兴趣"}]}
category 从以下选一个：兴趣 / 技能 / 时间 / 偏好 / 动机`;

const PROMPT_EN = `You help a research mentor compress a student's self-description into 3-5 "profile notes". Each note is a descriptive takeaway about the student's interests, skills, schedule, or research preferences — not a direct quote.
Rules:
- One short sentence each (max ~18 words), specific and descriptive
- Try to cover different dimensions (Interest / Skills / Time / Preference / Motivation)
- Return fewer notes rather than guessing — skip dimensions without enough evidence
- Don't write "The student says..." — just state the takeaway

Return ONLY JSON, no other text:
{"notes":[{"category":"Interest","summary":"Drawn to the intersection of AI and psychology"}]}
category must be one of: Interest / Skills / Time / Preference / Motivation`;

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
  const systemPrompt = locale === "zh" ? PROMPT_ZH : PROMPT_EN;

  const transcript = messages
    .map((m, i) => `[${i + 1}] ${m.content.trim()}`)
    .join("\n");

  const input =
    locale === "zh"
      ? `以下是学生在对话中说过的内容，按时间顺序：\n\n${transcript}`
      : `Here is what the student has said in the conversation, in order:\n\n${transcript}`;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(`${systemPrompt}\n\n${input}`);
    const raw = result.response.text().trim();

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
