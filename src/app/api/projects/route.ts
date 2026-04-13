import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { NextRequest, NextResponse } from "next/server";
import { generateWithAI } from "@/lib/gemini";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      topic: true,
      phases: { include: { tasks: true }, orderBy: { order: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

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

  // Generate phases using AI
  try {
    const phaseResult = await generateWithAI(
      "AI-S07",
      `课题名称：${topic.name}\n课题描述：${topic.description || "无"}\n产出形式：${topic.outputFormat || "研究报告"}\n时间跨度：${topic.duration || "12周"}\n每周投入：${topic.weeklyHours || "5小时"}`
    );

    const jsonMatch = phaseResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.phases) {
        for (const phase of parsed.phases) {
          await prisma.phase.create({
            data: {
              projectId: project.id,
              order: phase.order,
              name: phase.name,
              description: phase.description,
              goal: phase.goal,
              status: phase.order === 1 ? "active" : "locked",
              startWeek: phase.order,
              endWeek: phase.order + (phase.estimatedWeeks || 2) - 1,
            },
          });
        }
      }
    }
  } catch {
    // Fallback: create default phases
    const defaultPhases = [
      { name: "文献调研", description: "搜集和阅读相关文献资料", goal: "了解研究背景" },
      { name: "研究设计", description: "设计研究方法和实验方案", goal: "确定研究方案" },
      { name: "数据收集", description: "执行研究计划，收集数据", goal: "获得研究数据" },
      { name: "分析总结", description: "分析数据，撰写研究报告", goal: "完成研究产出" },
    ];
    for (let i = 0; i < defaultPhases.length; i++) {
      await prisma.phase.create({
        data: {
          projectId: project.id,
          order: i + 1,
          name: defaultPhases[i].name,
          description: defaultPhases[i].description,
          goal: defaultPhases[i].goal,
          status: i === 0 ? "active" : "locked",
          startWeek: i * 3 + 1,
          endWeek: (i + 1) * 3,
        },
      });
    }
  }

  // Generate tasks for the first active phase
  const activePhase = await prisma.phase.findFirst({
    where: { projectId: project.id, status: "active" },
  });

  if (activePhase) {
    try {
      const taskResult = await generateWithAI(
        "AI-S11",
        `阶段名称：${activePhase.name}\n阶段描述：${activePhase.description || ""}\n阶段目标：${activePhase.goal || ""}\n课题：${topic.name}`
      );
      const jsonMatch = taskResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.tasks) {
          for (const task of parsed.tasks) {
            await prisma.task.create({
              data: {
                phaseId: activePhase.id,
                order: task.order,
                title: task.title,
                description: task.description,
                weekNumber: activePhase.startWeek || 1,
                status: task.order === 1 ? "active" : "locked",
              },
            });
          }
        }
      }
    } catch {
      // Fallback: create default tasks
      const defaultTasks = [
        { title: "了解研究背景", description: "阅读相关资料，了解课题的研究背景和现状" },
        { title: "梳理关键概念", description: "整理课题涉及的关键概念和术语" },
        { title: "撰写文献综述", description: "写一篇简短的文献综述，总结你的发现" },
      ];
      for (let i = 0; i < defaultTasks.length; i++) {
        await prisma.task.create({
          data: {
            phaseId: activePhase.id,
            order: i + 1,
            title: defaultTasks[i].title,
            description: defaultTasks[i].description,
            weekNumber: activePhase.startWeek || 1,
            status: i === 0 ? "active" : "locked",
          },
        });
      }
    }
  }

  const fullProject = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      topic: true,
      phases: { include: { tasks: true }, orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(fullProject);
}
