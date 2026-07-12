"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Submission = {
  id: string;
  content: string;
  grade: string | null;
  feedback: string | null;
  version: number;
  createdAt: string;
};

type Task = {
  id: string;
  order: number;
  title: string;
  status: string;
  submissions: Submission[];
};

type Phase = {
  id: string;
  order: number;
  name: string;
  goal: string | null;
  status: string;
  reviews: { id: string; status: string; feedback: string | null; updatedAt: string }[];
  tasks: Task[];
};

type Project = {
  id: string;
  title: string;
  status: string;
  topic: { name: string; field: string | null; description: string | null } | null;
  phases: Phase[];
  journalEntries: { id: string; title: string; content: string; source: string; createdAt: string }[];
  conversations: {
    id: string;
    strategyId: string | null;
    messages: { id: string; role: string; content: string; createdAt: string }[];
  }[];
};

type StudentPayload = {
  class: { id: string; name: string; mode: string };
  student: { id: string; name: string; email: string; projects: Project[] };
};

function statusLabel(status: string, zh: boolean) {
  const map: Record<string, string> = {
    locked: zh ? "未开始" : "Locked",
    active: zh ? "进行中" : "Active",
    completed: zh ? "已完成" : "Completed",
    submitted_for_review: zh ? "待老师审核" : "Submitted for review",
  };
  return map[status] ?? status;
}

function progress(project: Project) {
  const tasks = project.phases.flatMap((phase) => phase.tasks);
  if (tasks.length === 0) return 0;
  const done = tasks.filter((task) => ["completed", "graded"].includes(task.status)).length;
  return Math.round((done / tasks.length) * 100);
}

export default function TeacherStudentPage() {
  const locale = useLocale();
  const zh = locale === "zh";
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params.studentId as string;
  const classId = searchParams.get("classId") || "";
  const [data, setData] = useState<StudentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [savingPhase, setSavingPhase] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/teacher/students/${studentId}?classId=${classId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, classId]);

  async function reviewPhase(phaseId: string, status: "approved" | "revision_requested") {
    setSavingPhase(phaseId);
    const res = await fetch("/api/teacher/phase-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phaseId, classId, status, feedback: feedback[phaseId] || "" }),
    });
    if (res.ok) {
      setFeedback((current) => ({ ...current, [phaseId]: "" }));
      await load();
    }
    setSavingPhase("");
  }

  const selectedProject = data?.student.projects[0] ?? null;

  const timeline = useMemo(() => {
    if (!selectedProject) return [];
    const taskEvents = selectedProject.phases.flatMap((phase) =>
      phase.tasks.flatMap((task) =>
        task.submissions.map((submission) => ({
          id: submission.id,
          date: submission.createdAt,
          title: `${task.title} v${submission.version}`,
          body: submission.feedback || submission.content,
          type: zh ? "任务提交" : "Task submission",
          meta: submission.grade ? `${zh ? "评分" : "Grade"} ${submission.grade}` : "",
        }))
      )
    );
    const journalEvents = selectedProject.journalEntries.map((entry) => ({
      id: entry.id,
      date: entry.createdAt,
      title: entry.title,
      body: entry.content,
      type: zh ? "科研日志" : "Journal",
      meta: entry.source,
    }));
    const messageEvents = selectedProject.conversations.flatMap((conversation) =>
      conversation.messages.slice(-6).map((message) => ({
        id: message.id,
        date: message.createdAt,
        title: message.role === "user" ? (zh ? "学生提问" : "Student message") : (zh ? "导师回复" : "Mentor reply"),
        body: message.content,
        type: zh ? "对话" : "Conversation",
        meta: conversation.strategyId || "",
      }))
    );
    return [...taskEvents, ...journalEvents, ...messageEvents]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);
  }, [selectedProject, zh]);

  if (loading) {
    return <div className="min-h-screen bg-bg px-6 py-20 text-center text-text-dim">{zh ? "加载中..." : "Loading..."}</div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-bg px-6 py-20 text-center text-text-dim">{zh ? "无法读取学生信息" : "Unable to load student"}</div>;
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Link href={`/${locale}/school/teacher`} className="mb-6 inline-flex text-sm text-text-dim hover:text-accent">
          {zh ? "返回教师端" : "Back to dashboard"}
        </Link>

        <div className="mb-8 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-semibold text-accent">{data.class.name}</div>
              <h1 className="mt-1 text-3xl font-bold text-text">{data.student.name}</h1>
              <p className="mt-1 text-sm text-text-dim">{data.student.email}</p>
            </div>
            <div className="rounded-xl bg-surface2 px-4 py-3 text-sm text-text-dim">
              {data.class.mode === "approval_required"
                ? (zh ? "阶段审核模式" : "Approval required")
                : (zh ? "观察模式" : "Observe only")}
            </div>
          </div>
        </div>

        {!selectedProject ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center text-text-dim">
            {zh ? "这个学生还没有创建科研项目。" : "This student has not created a research project yet."}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-5">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-text">{selectedProject.title}</h2>
                <p className="mt-2 text-sm text-text-dim">{selectedProject.topic?.description || selectedProject.topic?.name}</p>
                <div className="mt-4 h-2 rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${progress(selectedProject)}%` }} />
                </div>
                <div className="mt-2 text-xs text-text-muted">{progress(selectedProject)}% {zh ? "完成" : "complete"}</div>
              </div>

              {selectedProject.phases.map((phase) => {
                const review = phase.reviews[0];
                const canReview = data.class.mode === "approval_required" && phase.status === "submitted_for_review";
                return (
                  <div key={phase.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold text-accent">{zh ? "阶段" : "Phase"} {phase.order}</div>
                        <h3 className="mt-1 text-lg font-bold text-text">{phase.name}</h3>
                        {phase.goal && <p className="mt-1 text-sm text-text-dim">{phase.goal}</p>}
                      </div>
                      <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-semibold text-text-muted">
                        {statusLabel(phase.status, zh)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {phase.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                          <span className="text-sm text-text">{task.order}. {task.title}</span>
                          <span className="text-xs text-text-muted">{task.status}</span>
                        </div>
                      ))}
                    </div>

                    {review?.feedback && (
                      <div className="mt-4 rounded-xl border border-border bg-accent/5 p-3 text-sm text-text-dim">
                        <span className="font-semibold text-text">{zh ? "老师反馈：" : "Teacher feedback: "}</span>
                        {review.feedback}
                      </div>
                    )}

                    {canReview && (
                      <div className="mt-4 border-t border-border pt-4">
                        <textarea
                          value={feedback[phase.id] || ""}
                          onChange={(event) => setFeedback((current) => ({ ...current, [phase.id]: event.target.value }))}
                          rows={3}
                          placeholder={zh ? "写下阶段反馈或修改建议..." : "Write phase feedback or revision notes..."}
                          className="w-full resize-y rounded-xl border border-border bg-surface2 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                        />
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <button
                            onClick={() => reviewPhase(phase.id, "approved")}
                            disabled={savingPhase === phase.id}
                            className="rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green/90 disabled:opacity-45"
                          >
                            {zh ? "批准进入下一阶段" : "Approve next phase"}
                          </button>
                          <button
                            onClick={() => reviewPhase(phase.id, "revision_requested")}
                            disabled={savingPhase === phase.id}
                            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-dim hover:border-amber hover:text-amber disabled:opacity-45"
                          >
                            {zh ? "要求修改" : "Request revision"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-text">{zh ? "过程记录" : "Activity Timeline"}</h2>
                <div className="mt-4 space-y-3">
                  {timeline.length === 0 && <p className="text-sm text-text-muted">{zh ? "暂无记录" : "No activity yet"}</p>}
                  {timeline.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">{item.type}</span>
                        <span className="text-[11px] text-text-muted">{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-text">{item.title}</h3>
                      <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-text-dim">{item.body}</p>
                      {item.meta && <p className="mt-2 text-[11px] text-text-muted">{item.meta}</p>}
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
