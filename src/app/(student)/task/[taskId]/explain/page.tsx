"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TaskExplainPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [taskTitle, setTaskTitle] = useState("");

  useEffect(() => {
    async function fetchExplanation() {
      const res = await fetch("/api/projects");
      const projects = await res.json();
      let task = null;
      for (const p of projects) {
        for (const phase of p.phases) {
          const found = phase.tasks.find((t: { id: string }) => t.id === taskId);
          if (found) {
            task = { ...found, phaseName: phase.name, topicName: p.topic?.name || p.title };
            break;
          }
        }
      }

      if (!task) {
        setExplanation("任务未找到");
        setLoading(false);
        return;
      }

      setTaskTitle(task.title);

      if (task.explanation) {
        setExplanation(task.explanation);
        setLoading(false);
        return;
      }

      try {
        const genRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategyCode: "AI-S12",
            input: `任务名称：${task.title}\n任务描述：${task.description || "无"}\n所属阶段：${task.phaseName}\n课题：${task.topicName}`,
          }),
        });
        const data = await genRes.json();
        setExplanation(data.result);
      } catch {
        setExplanation(
          `# ${task.title}\n\n## 任务说明\n${task.description || "完成本阶段的任务要求。"}\n\n## 步骤指引\n1. 仔细阅读任务要求\n2. 查阅相关资料\n3. 开始动手完成\n4. 检查并提交\n\n> 💡 AI讲解功能需要配置 GEMINI_API_KEY 后才能使用完整功能。`
        );
      }
      setLoading(false);
    }
    fetchExplanation();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin mb-4" />
        <p className="text-text-dim">正在生成任务讲解...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-text-dim hover:text-accent text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        返回任务
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-lg">📖</div>
        <div>
          <h1 className="text-2xl font-bold text-text">任务讲解</h1>
          <p className="text-text-dim text-sm">{taskTitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-8">
        <div
          className="prose prose-sm max-w-none
            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-text
            [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-accent
            [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-text
            [&_p]:text-text-dim [&_p]:mb-3 [&_p]:leading-relaxed
            [&_li]:text-text-dim [&_li]:mb-1
            [&_blockquote]:border-l-3 [&_blockquote]:border-accent/30 [&_blockquote]:pl-4 [&_blockquote]:text-text-dim [&_blockquote]:bg-accent/5 [&_blockquote]:py-2 [&_blockquote]:rounded-r-xl
            [&_code]:bg-surface2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent [&_code]:text-xs
          "
          style={{ whiteSpace: "pre-wrap" }}
        >
          {explanation}
        </div>
      </div>
    </div>
  );
}
