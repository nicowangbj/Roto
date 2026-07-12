import { prisma } from "@/lib/prisma";
import { generateWithAI } from "@/lib/gemini";
import { getSessionUser } from "@/lib/session-user";
import { NextRequest, NextResponse } from "next/server";

const GRADE_ORDER: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };

function capGradeForHint(grade: string) {
  return GRADE_ORDER[grade] > GRADE_ORDER.C ? "C" : grade;
}

function parseJournalResult(
  result: string,
  fallbackTitle: string
): { title: string; content: string } {
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: typeof parsed.title === "string" ? parsed.title : fallbackTitle,
        content:
          typeof parsed.content === "string"
            ? parsed.content
            : result,
      };
    } catch {
      // Fall back to raw content below.
    }
  }

  return {
    title: fallbackTitle,
    content: result,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { taskId, content, isResubmission, hintUsed } = body;
  const locale = req.headers.get("x-locale") ?? "en";

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      submissions: { orderBy: { createdAt: "desc" }, take: 3 },
      phase: {
        include: {
          tasks: { orderBy: { order: "asc" } },
          project: {
            include: {
              topic: true,
              phases: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.phase.project.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  const topic = task.phase.project.topic;
  const priorSubmissions = task.submissions
    .map((submission) => `v${submission.version}: grade ${submission.grade || "N/A"}; feedback: ${submission.feedback || "N/A"}`)
    .join("\n");
  const taskContext =
    locale === "zh"
      ? `课题：${topic?.name || task.phase.project.title}
课题描述：${topic?.description || "无"}
学生画像：${topic?.userProfile || "无"}
关键词：${topic?.keywords || "无"}
阶段：${task.phase.name}
阶段目标：${task.phase.goal || "无"}
任务：${task.title}
任务描述：${task.description || "无"}
同阶段任务：${task.phase.tasks.map((item) => `${item.order}. ${item.title}（${item.status}）`).join("；")}
历史提交：
${priorSubmissions || "无"}`
      : `Topic: ${topic?.name || task.phase.project.title}
Topic description: ${topic?.description || "None"}
Student profile: ${topic?.userProfile || "None"}
Keywords: ${topic?.keywords || "None"}
Phase: ${task.phase.name}
Phase goal: ${task.phase.goal || "None"}
Task: ${task.title}
Task description: ${task.description || "None"}
Tasks in same phase: ${task.phase.tasks.map((item) => `${item.order}. ${item.title} (${item.status})`).join("; ")}
Previous submissions:
${priorSubmissions || "None"}`;

  try {
    // Grade the submission
    const gradeResult = await generateWithAI(
      strategyCode,
      `${taskContext}\n\n${locale === "zh" ? "学生提交内容" : "Student submission"}:\n${content}${hintUsed ? (locale === "zh" ? "\n\n注意：学生使用了Hint辅助，最高评分为C" : "\n\nNote: the student used a hint, so the maximum grade is C.") : ""}`,
      undefined,
      locale
    );

    const jsonMatch = gradeResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      grade = parsed.grade || "B";
      if (hintUsed) grade = capGradeForHint(grade);
    }

    // Generate feedback
    const feedbackResult = await generateWithAI(
      "AI-S15",
      `${taskContext}\n\n${locale === "zh" ? "评分" : "Grade"}：${grade}\n${locale === "zh" ? "提交内容" : "Submission"}：\n${content}`,
      undefined,
      locale
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
    data: { status: grade === "D" ? "graded" : "completed" },
  });

  if (grade !== "D") {
    const nextTask = task.phase.tasks.find(
      (item) => item.order > task.order && item.status === "locked"
    );
    if (nextTask) {
      await prisma.task.update({
        where: { id: nextTask.id },
        data: { status: "active" },
      });
    } else {
      const approvalEnrollment = await prisma.classEnrollment.findFirst({
        where: {
          studentId: user.id,
          class: { mode: "approval_required" },
        },
        include: { class: true },
      });

      if (approvalEnrollment) {
        await prisma.phase.update({
          where: { id: task.phaseId },
          data: { status: "submitted_for_review" },
        });
        await prisma.phaseReview.upsert({
          where: {
            phaseId_classId: {
              phaseId: task.phaseId,
              classId: approvalEnrollment.classId,
            },
          },
          update: { status: "pending", feedback: null, teacherId: approvalEnrollment.class.teacherId },
          create: {
            phaseId: task.phaseId,
            classId: approvalEnrollment.classId,
            teacherId: approvalEnrollment.class.teacherId,
            status: "pending",
          },
        });
      } else {
      await prisma.phase.update({
        where: { id: task.phaseId },
        data: { status: "completed" },
      });
      const nextPhase = task.phase.project.phases.find(
        (phase) => phase.order > task.phase.order && phase.status === "locked"
      );
      if (nextPhase) {
        await prisma.phase.update({
          where: { id: nextPhase.id },
          data: { status: "active" },
        });
        const firstTask = await prisma.task.findFirst({
          where: { phaseId: nextPhase.id },
          orderBy: { order: "asc" },
        });
        if (firstTask) {
          await prisma.task.update({
            where: { id: firstTask.id },
            data: { status: "active" },
          });
        }
      }
      }
    }
  }

  const taskJournalInput =
    locale === "zh"
      ? `事件类型：task_completed
${taskContext}

学生提交：
${content}

评分：${grade}
导师反馈：${feedback}
是否使用 Hint：${hintUsed ? "是" : "否"}

请生成一条自然的第一人称科研日志。`
      : `Event type: task_completed
${taskContext}

Student submission:
${content}

Grade: ${grade}
Mentor feedback: ${feedback}
Hint used: ${hintUsed ? "yes" : "no"}

Generate a natural first-person research journal entry.`;

  try {
    const journalResult = await generateWithAI("AI-S22", taskJournalInput, undefined, locale);
    const journal = parseJournalResult(
      journalResult,
      locale === "zh" ? `完成任务：${task.title}` : `Completed task: ${task.title}`
    );
    await prisma.journalEntry.create({
      data: {
        projectId: task.phase.projectId,
        title: journal.title,
        content: journal.content,
        source: "task_complete",
        sourceId: task.id,
        weekNumber: task.weekNumber,
      },
    });
  } catch {
    await prisma.journalEntry.create({
      data: {
        projectId: task.phase.projectId,
        title: locale === "zh" ? `完成任务：${task.title}` : `Completed task: ${task.title}`,
        content:
          locale === "zh"
            ? `我完成了「${task.title}」这个任务，并获得了 ${grade} 的评价。导师反馈中提到：${feedback}`
            : `I completed "${task.title}" and received a grade of ${grade}. My mentor's feedback was: ${feedback}`,
        source: "task_complete",
        sourceId: task.id,
        weekNumber: task.weekNumber,
      },
    });
  }

  const completedPhase = grade !== "D" && !task.phase.tasks.some(
    (item) => item.id !== task.id && item.status !== "completed" && item.status !== "graded"
  );

  if (completedPhase) {
    const phaseJournalInput =
      locale === "zh"
        ? `阶段完成事件：phase_completed
课题：${topic?.name || task.phase.project.title}
阶段：${task.phase.name}
阶段目标：${task.phase.goal || "无"}
阶段任务：${task.phase.tasks.map((item) => `${item.order}. ${item.title}`).join("；")}
最后完成的任务：${task.title}
最后一次评分：${grade}
导师反馈：${feedback}

请生成一条阶段总结日志，第一人称，2-4段。`
        : `Phase completion event: phase_completed
Topic: ${topic?.name || task.phase.project.title}
Phase: ${task.phase.name}
Phase goal: ${task.phase.goal || "None"}
Phase tasks: ${task.phase.tasks.map((item) => `${item.order}. ${item.title}`).join("; ")}
Last completed task: ${task.title}
Latest grade: ${grade}
Mentor feedback: ${feedback}

Generate a first-person phase summary journal entry in 2-4 short paragraphs.`;

    try {
      const phaseResult = await generateWithAI("AI-S24", phaseJournalInput, undefined, locale);
      const journal = parseJournalResult(
        phaseResult,
        locale === "zh" ? `完成阶段：${task.phase.name}` : `Completed phase: ${task.phase.name}`
      );
      await prisma.journalEntry.create({
        data: {
          projectId: task.phase.projectId,
          title: journal.title,
          content: journal.content,
          source: "phase_complete",
          sourceId: task.phase.id,
          weekNumber: task.phase.endWeek,
        },
      });
    } catch {
      await prisma.journalEntry.create({
        data: {
          projectId: task.phase.projectId,
          title: locale === "zh" ? `完成阶段：${task.phase.name}` : `Completed phase: ${task.phase.name}`,
          content:
            locale === "zh"
              ? `我完成了「${task.phase.name}」这个阶段。这个阶段让我围绕「${task.phase.goal || task.phase.name}」推进了关键任务，也让我更清楚下一步该怎么做。`
              : `I completed the "${task.phase.name}" phase. This stage helped me make progress toward "${task.phase.goal || task.phase.name}" and clarified what I should do next.`,
          source: "phase_complete",
          sourceId: task.phase.id,
          weekNumber: task.phase.endWeek,
        },
      });
    }
  }

  return NextResponse.json(submission);
}
