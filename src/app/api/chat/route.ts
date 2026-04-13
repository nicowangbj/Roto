import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { chatWithAI } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

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

  try {
    const reply = await chatWithAI(strategyCode || "AI-S01", messages, context);

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
  } catch (error) {
    // If Gemini API fails (e.g., no API key), return a placeholder response
    const placeholder = "我是研途AI导师。当前AI服务未配置，请在 .env 文件中设置 GEMINI_API_KEY。我会在配置完成后为你提供完整的科研指导服务。";

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
