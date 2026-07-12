import Link from "next/link";

export default async function SchoolHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const zh = locale === "zh";

  return (
    <main className="min-h-screen bg-bg px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between border-b border-border pb-5">
          <Link href={`/${locale}/welcome`} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-lg font-black text-brand-ink">
              R
            </div>
            <div>
              <div className="text-xl font-bold text-brand-ink">Roto for School</div>
              <div className="text-xs text-text-muted">
                {zh ? "学校科研管理版本" : "School research supervision"}
              </div>
            </div>
          </Link>
          <Link
            href={`/${locale}/welcome`}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-dim transition-colors hover:border-accent hover:text-accent"
          >
            {zh ? "个人版" : "Personal version"}
          </Link>
        </header>

        <section className="mb-8">
          <h1 className="text-3xl font-bold text-text">
            {zh ? "面向学校的科研指导工作台" : "A school workspace for guided student research"}
          </h1>
          <p className="mt-3 max-w-2xl text-text-dim">
            {zh
              ? "学校版和学生自主探索版相互隔离。这里是教师和学校管理员使用的工作台，用于创建班级、查看学生科研过程，并在需要时审核阶段与留下反馈。"
              : "The school version is separated from the personal exploration flow. This workspace is for teachers and school administrators to create classes, monitor student research, and review phases when approval is required."}
          </p>
        </section>

        <div className="grid gap-4">
          <Link
            href={`/${locale}/school/teacher`}
            className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-colors hover:border-accent hover:bg-accent/5"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-xl text-accent">
              T
            </div>
            <h2 className="text-xl font-bold text-text">{zh ? "教师端" : "Teacher workspace"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-dim">
              {zh
                ? "创建班级、查看学生进度、检查 timeline，并审核学生阶段提交。"
                : "Create classes, track progress, inspect timelines, and review student phase submissions."}
            </p>
          </Link>
        </div>

        <p className="mt-5 text-sm text-text-muted">
          {zh
            ? "学生端使用单独入口，由学校或老师把学生链接和邀请码发给学生。"
            : "Student access uses a separate entry page. Schools or teachers can share the student link and invite code directly with students."}
        </p>
      </div>
    </main>
  );
}
