"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

type TeacherClass = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  mode: string;
  enrollments: {
    id: string;
    student: {
      id: string;
      name: string;
      email: string;
      projects: {
        id: string;
        title: string;
        status: string;
        updatedAt: string;
        phases: {
          status: string;
          tasks: { status: string; submissions: unknown[] }[];
          reviews: { status: string }[];
        }[];
      }[];
    };
  }[];
};

function projectProgress(project: TeacherClass["enrollments"][number]["student"]["projects"][number]) {
  const tasks = project.phases.flatMap((phase) => phase.tasks);
  if (tasks.length === 0) return 0;
  const done = tasks.filter((task) => ["completed", "graded"].includes(task.status)).length;
  return Math.round((done / tasks.length) * 100);
}

function pendingReviewCount(project: TeacherClass["enrollments"][number]["student"]["projects"][number]) {
  return project.phases.filter((phase) =>
    phase.status === "submitted_for_review" ||
    phase.reviews.some((review) => review.status === "pending")
  ).length;
}

export default function TeacherDashboardPage() {
  const locale = useLocale();
  const zh = locale === "zh";
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("observe");

  async function loadClasses() {
    setLoading(true);
    const res = await fetch("/api/teacher/classes");
    if (res.ok) setClasses(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/teacher/classes")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setClasses(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function createClass() {
    if (!name.trim() || creating) return;
    setCreating(true);
    const res = await fetch("/api/teacher/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, mode }),
    });
    if (res.ok) {
      setName("");
      setDescription("");
      setMode("observe");
      await loadClasses();
    }
    setCreating(false);
  }

  const totals = useMemo(() => {
    const students = classes.reduce((sum, item) => sum + item.enrollments.length, 0);
    const projects = classes.reduce(
      (sum, item) => sum + item.enrollments.reduce((inner, enrollment) => inner + enrollment.student.projects.length, 0),
      0
    );
    const pending = classes.reduce(
      (sum, item) =>
        sum +
        item.enrollments.reduce(
          (inner, enrollment) => inner + enrollment.student.projects.reduce((pSum, project) => pSum + pendingReviewCount(project), 0),
          0
        ),
      0
    );
    return { students, projects, pending };
  }, [classes]);

  return (
    <main className="min-h-screen bg-bg px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href={`/${locale}/school`} className="mb-4 inline-flex text-sm text-text-dim hover:text-accent">
              {zh ? "返回 School 入口" : "Back to School"}
            </Link>
            <h1 className="text-3xl font-bold text-text">{zh ? "教师端" : "Teacher Dashboard"}</h1>
            <p className="mt-2 text-text-dim">
              {zh ? "查看学生科研进度，审核阶段，并留下反馈。" : "Track student research activity, review phases, and leave feedback."}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-border bg-white px-4 py-3">
              <div className="text-xl font-bold text-text">{totals.students}</div>
              <div className="text-xs text-text-muted">{zh ? "学生" : "Students"}</div>
            </div>
            <div className="rounded-xl border border-border bg-white px-4 py-3">
              <div className="text-xl font-bold text-text">{totals.projects}</div>
              <div className="text-xs text-text-muted">{zh ? "项目" : "Projects"}</div>
            </div>
            <div className="rounded-xl border border-border bg-white px-4 py-3">
              <div className="text-xl font-bold text-amber">{totals.pending}</div>
              <div className="text-xs text-text-muted">{zh ? "待审核" : "Reviews"}</div>
            </div>
          </div>
        </div>

        <section className="mb-8 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-text">{zh ? "创建班级" : "Create Class"}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1.5fr_1fr_auto]">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={zh ? "班级名称" : "Class name"}
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={zh ? "描述（可选）" : "Description (optional)"}
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            >
              <option value="observe">{zh ? "观察模式" : "Observe only"}</option>
              <option value="approval_required">{zh ? "阶段审核模式" : "Approval required"}</option>
            </select>
            <button
              onClick={createClass}
              disabled={creating || !name.trim()}
              className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-45"
            >
              {creating ? (zh ? "创建中" : "Creating") : (zh ? "创建" : "Create")}
            </button>
          </div>
        </section>

        {loading ? (
          <div className="py-16 text-center text-text-dim">{zh ? "加载中..." : "Loading..."}</div>
        ) : (
          <div className="space-y-6">
            {classes.map((teacherClass) => (
              <section key={teacherClass.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-text">{teacherClass.name}</h2>
                    {teacherClass.description && <p className="mt-1 text-sm text-text-dim">{teacherClass.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        {teacherClass.mode === "approval_required" ? (zh ? "阶段审核模式" : "Approval required") : (zh ? "观察模式" : "Observe only")}
                      </span>
                      <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-semibold text-text-dim">
                        {zh ? "邀请码" : "Invite code"}: {teacherClass.inviteCode}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-text-muted">{teacherClass.enrollments.length} {zh ? "名学生" : "students"}</div>
                </div>

                <div className="grid gap-3">
                  {teacherClass.enrollments.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-5 text-sm text-text-muted">
                      {zh ? "还没有学生加入。把邀请码发给学生即可。" : "No students yet. Share the invite code with students."}
                    </div>
                  )}
                  {teacherClass.enrollments.map((enrollment) => {
                    const latestProject = enrollment.student.projects[0];
                    const progress = latestProject ? projectProgress(latestProject) : 0;
                    const pending = latestProject ? pendingReviewCount(latestProject) : 0;
                    return (
                      <Link
                        key={enrollment.id}
                        href={`/${locale}/school/teacher/student/${enrollment.student.id}?classId=${teacherClass.id}`}
                        className="rounded-xl border border-border p-4 transition-colors hover:border-accent hover:bg-accent/5"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-semibold text-text">{enrollment.student.name}</div>
                            <div className="text-xs text-text-muted">{enrollment.student.email}</div>
                          </div>
                          <div className="min-w-0 flex-1 md:max-w-md">
                            <div className="truncate text-sm font-medium text-text">
                              {latestProject?.title ?? (zh ? "还没有项目" : "No project yet")}
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-surface2">
                              <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <span className="rounded-full bg-surface2 px-3 py-1 text-text-muted">{progress}%</span>
                            {pending > 0 && (
                              <span className="rounded-full bg-amber/10 px-3 py-1 font-semibold text-amber">
                                {pending} {zh ? "待审核" : "pending"}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
