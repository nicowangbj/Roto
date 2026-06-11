import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { NextRequest, NextResponse } from "next/server";
import { generateWithAI } from "@/lib/gemini";

function parseTotalWeeks(duration: string | null | undefined): number {
  const matches = duration?.match(/\d+/g)?.map(Number).filter((n) => n > 0) ?? [];
  if (matches.length === 0) return 12;
  return Math.max(...matches);
}

function getPhaseWeekRanges(
  phases: unknown[],
  totalWeeks: number
): { startWeek: number; endWeek: number }[] {
  const count = Math.max(phases.length, 1);
  let cursor = 1;

  return phases.map((phase, index) => {
    const estimatedWeeks =
      typeof phase === "object" &&
      phase !== null &&
      "estimatedWeeks" in phase &&
      typeof phase.estimatedWeeks === "number"
        ? phase.estimatedWeeks
        : undefined;
    const remainingPhases = count - index;
    const remainingWeeks = totalWeeks - cursor + 1;
    const suggested = Number.isFinite(estimatedWeeks)
      ? Math.max(1, Math.floor(estimatedWeeks ?? 1))
      : Math.ceil(remainingWeeks / remainingPhases);
    const weeksForPhase = index === count - 1
      ? Math.max(1, remainingWeeks)
      : Math.max(1, Math.min(suggested, remainingWeeks - remainingPhases + 1));
    const startWeek = cursor;
    const endWeek = cursor + weeksForPhase - 1;
    cursor = endWeek + 1;
    return { startWeek, endWeek };
  });
}

type ProjectPhase = {
  id: string;
  order: number;
  name: string;
  description: string | null;
  goal: string | null;
  startWeek: number | null;
  endWeek: number | null;
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      topic: true,
      phases: {
        include: { tasks: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const locale = req.headers.get("x-locale") ?? "en";
  const zh = locale === "zh";
  const totalWeeks = parseTotalWeeks(body.duration);
  const selectedKeywords = Array.isArray(body.selectedKeywords)
    ? body.selectedKeywords.filter((item: unknown): item is string => typeof item === "string")
    : [];
  const selectedReferences = Array.isArray(body.selectedReferences)
    ? body.selectedReferences.filter((item: unknown): item is string => typeof item === "string")
    : [];
  const userProfile =
    body.userProfile && typeof body.userProfile === "object"
      ? JSON.stringify(body.userProfile)
      : null;
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : null;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // Create topic
  const topic = await prisma.topic.create({
    data: {
      name: body.topicName || "未命名课题",
      field: body.field || null,
      description: body.description || null,
      outputFormat: body.outputFormat || null,
      duration: body.duration || null,
      weeklyHours: body.weeklyHours || null,
      userProfile,
      keywords: selectedKeywords.length > 0 ? JSON.stringify(selectedKeywords) : null,
      selectedPath: body.selectedPath || "no_topic",
      confirmed: true,
    },
  });

  // Create project
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      title: body.topicName || "未命名项目",
      description: body.description || null,
      topicId: topic.id,
      status: "planning",
    },
  });

  if (conversationId) {
    await prisma.conversation.updateMany({
      where: {
        id: conversationId,
        userId: user.id,
      },
      data: { projectId: project.id },
    });
  }

  const defaultPhases = zh
    ? [
        { name: "文献调研", description: "搜集和阅读相关文献资料", goal: "了解研究背景" },
        { name: "研究设计", description: "设计研究方法和实验方案", goal: "确定研究方案" },
        { name: "数据收集", description: "执行研究计划，收集数据", goal: "获得研究数据" },
        { name: "分析总结", description: "分析数据，撰写研究报告", goal: "完成研究产出" },
      ]
    : [
        { name: "Literature review", description: "Collect and read relevant background materials", goal: "Understand the research background" },
        { name: "Research design", description: "Design the research method and execution plan", goal: "Define a feasible research approach" },
        { name: "Data collection", description: "Carry out the plan and collect evidence or data", goal: "Obtain usable research data" },
        { name: "Analysis and report", description: "Analyze findings and write the research report", goal: "Complete the final research output" },
      ];

  async function createDefaultPhases() {
    const weekRanges = getPhaseWeekRanges(defaultPhases, totalWeeks);
    for (let i = 0; i < defaultPhases.length; i++) {
      await prisma.phase.create({
        data: {
          projectId: project.id,
          order: i + 1,
          name: defaultPhases[i].name,
          description: defaultPhases[i].description,
          goal: defaultPhases[i].goal,
          status: i === 0 ? "active" : "locked",
          startWeek: weekRanges[i].startWeek,
          endWeek: weekRanges[i].endWeek,
        },
      });
    }
  }

  // Generate phases using AI
  let phaseCreated = false;
  try {
    const phaseInput = zh
      ? `课题名称：${topic.name}\n课题描述：${topic.description || "无"}\n学生画像：${userProfile || "无"}\n学生选择的关键词：${selectedKeywords.join("、") || "无"}\n学生感兴趣的参考案例：${selectedReferences.join("、") || "无"}\n产出形式：${topic.outputFormat || "研究报告"}\n时间跨度：${topic.duration || "12周"}\n每周投入：${topic.weeklyHours || "5小时"}`
      : `Topic name: ${topic.name}\nTopic description: ${topic.description || "None"}\nStudent profile: ${userProfile || "None"}\nSelected keywords: ${selectedKeywords.join(", ") || "None"}\nReference cases of interest: ${selectedReferences.join(", ") || "None"}\nExpected output: ${topic.outputFormat || "Research report"}\nTimeline: ${topic.duration || "12 weeks"}\nWeekly commitment: ${topic.weeklyHours || "5 hours"}`;
    const phaseResult = await generateWithAI(
      "AI-S07",
      phaseInput,
      undefined,
      locale
    );

    const jsonMatch = phaseResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.phases) {
        const phases = parsed.phases as {
          order?: number;
          name?: string;
          description?: string;
          goal?: string;
          estimatedWeeks?: number;
        }[];
        const weekRanges = getPhaseWeekRanges(phases, totalWeeks);
        for (const [index, phase] of phases.entries()) {
          const order = typeof phase.order === "number" ? phase.order : index + 1;
          const weekRange = weekRanges[index];
          await prisma.phase.create({
            data: {
              projectId: project.id,
              order,
              name: phase.name || (zh ? `阶段 ${order}` : `Phase ${order}`),
              description: phase.description,
              goal: phase.goal,
              status: order === 1 ? "active" : "locked",
              startWeek: weekRange.startWeek,
              endWeek: weekRange.endWeek,
            },
          });
          phaseCreated = true;
        }
      }
    }
  } catch {
    // Fallback below.
  }

  if (!phaseCreated) {
    await createDefaultPhases();
  }

  async function createTasksForPhase(phase: ProjectPhase) {
    const defaultTasks = zh
      ? [
          { title: "了解研究背景", description: "阅读相关资料，了解课题的研究背景和现状" },
          { title: "梳理关键概念", description: "整理课题涉及的关键概念和术语" },
          { title: "撰写文献综述", description: "写一篇简短的文献综述，总结你的发现" },
        ]
      : [
          { title: "Understand the research background", description: "Read relevant materials and understand the current context of the topic" },
          { title: "Organize key concepts", description: "Summarize the key concepts and terms involved in the topic" },
          { title: "Write a short literature review", description: "Write a concise review that summarizes what you have learned so far" },
        ];

    async function createDefaultTasks() {
      for (let i = 0; i < defaultTasks.length; i++) {
        await prisma.task.create({
          data: {
            phaseId: phase.id,
            order: i + 1,
            title: defaultTasks[i].title,
            description: defaultTasks[i].description,
            weekNumber: phase.startWeek || 1,
            status: phase.order === 1 && i === 0 ? "active" : "locked",
          },
        });
      }
    }

    let taskCreated = false;
    try {
      const taskInput = zh
        ? `阶段名称：${phase.name}\n阶段描述：${phase.description || ""}\n阶段目标：${phase.goal || ""}\n阶段时间：第 ${phase.startWeek || 1}-${phase.endWeek || phase.startWeek || 1} 周\n课题：${topic.name}\n学生画像：${userProfile || "无"}\n关键词：${selectedKeywords.join("、") || "无"}`
        : `Phase name: ${phase.name}\nPhase description: ${phase.description || ""}\nPhase goal: ${phase.goal || ""}\nPhase timeline: Week ${phase.startWeek || 1}-${phase.endWeek || phase.startWeek || 1}\nTopic: ${topic.name}\nStudent profile: ${userProfile || "None"}\nKeywords: ${selectedKeywords.join(", ") || "None"}`;
      const taskResult = await generateWithAI(
        "AI-S11",
        taskInput,
        undefined,
        locale
      );
      const jsonMatch = taskResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.tasks) {
          for (const task of parsed.tasks) {
            const order = typeof task.order === "number" ? task.order : 1;
            await prisma.task.create({
              data: {
                phaseId: phase.id,
                order,
                title: task.title || (zh ? `任务 ${order}` : `Task ${order}`),
                description: task.description,
                weekNumber: phase.startWeek || 1,
                status: phase.order === 1 && order === 1 ? "active" : "locked",
              },
            });
            taskCreated = true;
          }
        }
      }
    } catch {
      // Fallback below.
    }

    if (!taskCreated) {
      await createDefaultTasks();
    }
  }

  // Pre-generate task details for every phase so the full plan is explorable.
  const createdPhases = await prisma.phase.findMany({
    where: { projectId: project.id },
    orderBy: { order: "asc" },
  });
  for (const phase of createdPhases) {
    await createTasksForPhase(phase);
  }

  const fullProject = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      topic: true,
      phases: {
        include: { tasks: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  return NextResponse.json(fullProject);
}
