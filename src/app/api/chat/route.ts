import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { chatWithAI } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

interface TopicReplyShape {
  name?: unknown;
  reason?: unknown;
  researchPoints?: unknown;
}

function cleanTopicChatReply(reply: string, locale: string): string {
  const stripped = reply
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!stripped.startsWith("{") && !stripped.startsWith("[")) return reply;

  try {
    const parsed = JSON.parse(stripped);
    const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
    if (topics.length === 0) return reply;

    const first = topics[0] as TopicReplyShape;
    const title = typeof first.name === "string" ? first.name : "";
    const reason = typeof first.reason === "string" ? first.reason : "";
    const points = Array.isArray(first.researchPoints)
      ? first.researchPoints.filter((point): point is string => typeof point === "string")
      : [];

    if (locale === "zh") {
      return [
        title ? `可以，最适合改造的是「${title}」。` : "可以，这个想法可以和当前推荐课题结合。",
        reason,
        points.length > 0 ? `可以重点看这几个研究点：${points.slice(0, 3).join("；")}。` : "",
      ].filter(Boolean).join("\n\n");
    }

    return [
      title ? `Yes. The strongest fit is "${title}".` : "Yes, this idea can connect to the current topic set.",
      reason,
      points.length > 0 ? `The most useful angles are: ${points.slice(0, 3).join("; ")}.` : "",
    ].filter(Boolean).join("\n\n");
  } catch {
    return reply;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conversationId, message, strategyCode, projectId, context } = body;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let conversation;
  if (conversationId) {
    conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        projectId: projectId || null,
        strategyId: strategyCode || null,
        context: context || null,
      },
      include: { messages: [] as never },
    });
    // Type fix: ensure messages is an array
    conversation = { ...conversation, messages: [] as { id: string; role: string; content: string; createdAt: Date; conversationId: string }[] };
  }

  // Save user message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: message,
    },
  });

  // Build message history
  const messages = [
    ...conversation.messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const locale = req.headers.get("x-locale") ?? "en";

  try {
    const rawReply = await chatWithAI(strategyCode || "AI-S01", messages, context, locale);
    const reply = strategyCode === "AI-S05_CHAT"
      ? cleanTopicChatReply(rawReply, locale)
      : rawReply;

    // Save assistant message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      reply,
    });
  } catch (err) {
    console.error("Chat API error:", err);
    const placeholder =
      locale === "zh"
        ? "我是 Roto AI 导师。当前 AI 服务还未配置，请在 .env 文件中设置 GEMINI_API_KEY。配置完成后，我会继续陪你把研究这件事讲清楚、做下去。"
        : "I'm Roto, your AI research mentor. The AI service isn't configured yet — please set GEMINI_API_KEY in your .env file. Once configured, I'll be here to guide your research journey.";

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: placeholder,
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      reply: placeholder,
    });
  }
}
