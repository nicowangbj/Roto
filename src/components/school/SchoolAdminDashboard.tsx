"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

type AdminSchool = {
  id: string;
  name: string;
  description: string | null;
  memberships: {
    id: string;
    role: string;
    user: { id: string; name: string; email: string; role: string };
  }[];
  classes: {
    id: string;
    name: string;
    mode: string;
    inviteCode: string;
    teacher: { id: string; name: string; email: string };
    enrollments: {
      id: string;
      student: {
        id: string;
        name: string;
        email: string;
        projects: { id: string; status: string }[];
      };
    }[];
  }[];
};

export default function SchoolAdminDashboard() {
  const locale = useLocale();
  const zh = locale === "zh";
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [schoolDescription, setSchoolDescription] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherRole, setTeacherRole] = useState("teacher");
  const [message, setMessage] = useState("");

  const activeSchool = schools[0];

  async function loadAdmin(options?: { silent?: boolean }) {
    if (!options?.silent) setLoading(true);
    const res = await fetch("/api/school/admin");
    if (res.ok) {
      const data = await res.json();
      setSchools(data.adminSchools ?? []);
    } else {
      setSchools([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/school/admin")
      .then((res) => (res.ok ? res.json() : { adminSchools: [] }))
      .then((data) => {
        if (!cancelled) setSchools(data.adminSchools ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function createSchool() {
    if (creating) return;
    setCreating(true);
    setMessage("");
    const res = await fetch("/api/school/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: schoolName, description: schoolDescription }),
    });
    if (res.ok) {
      setSchoolName("");
      setSchoolDescription("");
      setMessage(zh ? "学校 workspace 已创建。" : "School workspace created.");
      await loadAdmin();
    } else {
      setMessage(zh ? "创建失败，请先登录后重试。" : "Creation failed. Please sign in and try again.");
    }
    setCreating(false);
  }

  async function addTeacher() {
    if (!activeSchool || !teacherEmail.trim() || addingTeacher) return;
    setAddingTeacher(true);
    setMessage("");
    const res = await fetch("/api/school/admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: activeSchool.id,
        name: teacherName,
        email: teacherEmail,
        role: teacherRole,
      }),
    });
    if (res.ok) {
      setTeacherName("");
      setTeacherEmail("");
      setTeacherRole("teacher");
      setMessage(zh ? "成员已加入学校 workspace。" : "Member added to the school workspace.");
      await loadAdmin();
    } else {
      setMessage(zh ? "添加失败。请确认你是学校管理员。" : "Could not add this member. Please confirm you are a school admin.");
    }
    setAddingTeacher(false);
  }

  const totals = useMemo(() => {
    if (!activeSchool) return { teachers: 0, students: 0, classes: 0, projects: 0 };
    const teachers = activeSchool.memberships.filter((item) => item.role === "teacher" || item.role === "school_admin").length;
    const studentIds = new Set<string>();
    let projects = 0;
    activeSchool.classes.forEach((schoolClass) => {
      schoolClass.enrollments.forEach((enrollment) => {
        studentIds.add(enrollment.student.id);
        projects += enrollment.student.projects.length;
      });
    });
    return { teachers, students: studentIds.size, classes: activeSchool.classes.length, projects };
  }, [activeSchool]);

  return (
    <main className="min-h-screen bg-bg px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href={`/${locale}/school`} className="mb-4 inline-flex text-sm text-text-dim hover:text-accent">
            {zh ? "返回 School 入口" : "Back to School"}
          </Link>
          <h1 className="text-3xl font-bold text-text">{zh ? "学校管理员后台" : "School Admin"}</h1>
          <p className="mt-2 max-w-2xl text-text-dim">
            {zh
              ? "创建学校 workspace，管理老师、班级和学生科研项目概览。"
              : "Create a school workspace and manage teachers, classes, and student research visibility."}
          </p>
        </div>

        {message && <div className="mb-6 rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-dim">{message}</div>}

        {loading ? (
          <div className="py-16 text-center text-text-dim">{zh ? "加载中..." : "Loading..."}</div>
        ) : !activeSchool ? (
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-text">{zh ? "创建学校 workspace" : "Create school workspace"}</h2>
            <p className="mt-2 text-sm text-text-dim">
              {zh
                ? "这是学校版的组织边界。创建后，老师、班级和学生都会归属于这个学校。"
                : "This creates the organization boundary for Roto for School. Teachers, classes, and students will belong to this school."}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1.4fr_auto]">
              <input
                value={schoolName}
                onChange={(event) => setSchoolName(event.target.value)}
                placeholder={zh ? "学校名称" : "School name"}
                className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
              <input
                value={schoolDescription}
                onChange={(event) => setSchoolDescription(event.target.value)}
                placeholder={zh ? "描述（可选）" : "Description (optional)"}
                className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
              <button
                onClick={createSchool}
                disabled={creating}
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-45"
              >
                {creating ? (zh ? "创建中" : "Creating") : zh ? "创建" : "Create"}
              </button>
            </div>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-text">{activeSchool.name}</h2>
                  {activeSchool.description && <p className="mt-2 text-text-dim">{activeSchool.description}</p>}
                </div>
                <Link
                  href={`/${locale}/school/teacher`}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-dim hover:border-accent hover:text-accent"
                >
                  {zh ? "进入教师端" : "Open Teacher workspace"}
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  [zh ? "老师" : "Teachers", totals.teachers],
                  [zh ? "学生" : "Students", totals.students],
                  [zh ? "班级" : "Classes", totals.classes],
                  [zh ? "项目" : "Projects", totals.projects],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border bg-surface2 px-4 py-3">
                    <div className="text-xl font-bold text-text">{value}</div>
                    <div className="text-xs text-text-muted">{label}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-text">{zh ? "添加老师 / 管理员" : "Add teacher / admin"}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.2fr_0.8fr_auto]">
                <input
                  value={teacherName}
                  onChange={(event) => setTeacherName(event.target.value)}
                  placeholder={zh ? "姓名（可选）" : "Name (optional)"}
                  className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                />
                <input
                  value={teacherEmail}
                  onChange={(event) => setTeacherEmail(event.target.value)}
                  placeholder={zh ? "邮箱" : "Email"}
                  className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                />
                <select
                  value={teacherRole}
                  onChange={(event) => setTeacherRole(event.target.value)}
                  className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="teacher">{zh ? "老师" : "Teacher"}</option>
                  <option value="school_admin">{zh ? "学校管理员" : "School admin"}</option>
                </select>
                <button
                  onClick={addTeacher}
                  disabled={addingTeacher || !teacherEmail.trim()}
                  className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-45"
                >
                  {addingTeacher ? (zh ? "添加中" : "Adding") : zh ? "添加" : "Add"}
                </button>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-text">{zh ? "学校成员" : "School members"}</h2>
                <div className="mt-4 space-y-3">
                  {activeSchool.memberships.map((membership) => (
                    <div key={membership.id} className="rounded-xl border border-border p-4">
                      <div className="font-semibold text-text">{membership.user.name}</div>
                      <div className="text-xs text-text-muted">{membership.user.email}</div>
                      <div className="mt-2 inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        {membership.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-text">{zh ? "班级概览" : "Class overview"}</h2>
                <div className="mt-4 space-y-3">
                  {activeSchool.classes.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-5 text-sm text-text-muted">
                      {zh ? "还没有班级。老师可以从教师端创建班级。" : "No classes yet. Teachers can create classes from the teacher workspace."}
                    </div>
                  )}
                  {activeSchool.classes.map((schoolClass) => (
                    <div key={schoolClass.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-text">{schoolClass.name}</div>
                          <div className="text-xs text-text-muted">{schoolClass.teacher.name} · {schoolClass.teacher.email}</div>
                        </div>
                        <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-semibold text-text-dim">
                          {schoolClass.enrollments.length} {zh ? "名学生" : "students"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-text-muted">
                        {zh ? "邀请码" : "Invite code"}: {schoolClass.inviteCode}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
