import { generateWithAI } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { NextRequest, NextResponse } from "next/server";

async function buildConversationInput(
  conversationId: string,
  locale: string,
  supplement?: string,
  input?: string
) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId: user.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const transcript = conversation.messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message, index) => {
      const role =
        locale === "zh"
          ? message.role === "user"
            ? "学生"
            : "导师"
          : message.role === "user"
            ? "Student"
            : "Mentor";
      return `[${index + 1}] ${role}: ${message.content}`;
    })
    .join("\n\n");

  const supplementBlock = supplement?.trim()
    ? locale === "zh"
      ? `\n\n补充信息：\n${supplement.trim()}`
      : `\n\nSupplementary information:\n${supplement.trim()}`
    : "";

  const inputBlock = input?.trim()
    ? locale === "zh"
      ? `\n\n当前环节输入：\n${input.trim()}`
      : `\n\nCurrent step input:\n${input.trim()}`
    : "";

  return locale === "zh"
    ? `以下是导师与学生的完整对话记录。请严格基于这些内容和当前环节输入完成本次生成任务，不要编造对话或输入中没有体现的信息。\n\n${transcript}${supplementBlock}${inputBlock}`
    : `Here is the full conversation between the mentor and the student. Complete the current generation task strictly based on this transcript and the current step input. Do not invent information that is not supported by the conversation or input.\n\n${transcript}${supplementBlock}${inputBlock}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { strategyCode, input, context, conversationId, supplement } = body;

  const locale = req.headers.get("x-locale") ?? "en";

  try {
    const resolvedInput =
      typeof conversationId === "string" && conversationId.trim().length > 0
        ? await buildConversationInput(conversationId, locale, supplement, input)
        : input;
    const result = await generateWithAI(strategyCode, resolvedInput, context, locale);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("Generate API error:", err);
    return NextResponse.json({
      result: JSON.stringify({
        error:
          locale === "zh"
            ? "AI服务未配置，请设置 GEMINI_API_KEY"
            : "AI service not configured. Please set GEMINI_API_KEY.",
      }),
    });
  }
}
