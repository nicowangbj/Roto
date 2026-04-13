import { prisma } from "@/lib/prisma";
import { generateWithAI } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { taskId, content, isResubmission, hintUsed } = body;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { phase: { include: { project: { include: { topic: true } } } } },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Count existing submissions for version number
  const existingCount = await prisma.submission.count({
    where: { taskId },
  });

  const maxGrade = hintUsed ? "C" : "A";
  const strategyCode = isResubmission ? "AI-S18" : "AI-S14";

  let grade = "B";
  let feedback = "";
  let suggestions = "";

  try {
    // Grade the submission
    const gradeResult = await generateWithAI(
      strategyCode,
      `任务：${task.title}\n任务描述：${task.description || ""}\n课题：${task.phase.project.topic?.name || ""}\n\n学生提交内容：\n${content}${hintUsed ? "\n\n注意：学生使用了Hint辅助，最高评分为C" : ""}`
    );

    const jsonMatch = gradeResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      grade = parsed.grade || "B";
      if (hintUsed && grade < "C") grade = "C";
    }

    // Generate feedback
    const feedbackResult = await generateWithAI(
      "AI-S15",
      `任务：${task.title}\n评分：${grade}\n提交内容：\n${content}`
    );

    const fbMatch = feedbackResult.match(/\{[\s\S]*\}/);
    if (fbMatch) {
      const parsed = JSON.parse(fbMatch[0]);
      feedback = parsed.feedback || feedbackResult;
      suggestions = JSON.stringify(parsed.improvements || []);
    } else {
      feedback = feedbackResult;
    }
  } catch {
    // Fallback grading
    grade = hintUsed ? "C" : "B";
    feedback = "AI评分服务未配置。这是一个默认评分。请在 .env 中设置 GEMINI_API_KEY 以启用完整的评分功能。";
    suggestions = JSON.stringify([
      { targetGrade: "A", suggestions: ["深入分析，展现独立思考"] },
      { targetGrade: "B", suggestions: ["完善细节，确保完整性"] },
    ]);
  }

  const submission = await prisma.submission.create({
    data: {
      taskId,
      content,
      version: existingCount + 1,
      grade,
      feedback,
      suggestions,
      hintUsed: hintUsed || false,
      maxGrade,
    },
  });

  // Update task status
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "graded" },
  });

  return NextResponse.json(submission);
}
