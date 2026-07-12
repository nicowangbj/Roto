"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function SchoolStudentPage() {
  const locale = useLocale();
  const zh = locale === "zh";
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [joining, setJoining] = useState(false);

  async function joinClass() {
    if (!inviteCode.trim() || joining) return;
    setJoining(true);
    setMessage(zh ? "正在加入班级..." : "Joining class...");
    const res = await fetch("/api/classes/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessage(
        zh
          ? `已加入：${data.class?.name ?? "班级"}。你可以继续学校版学生科研流程。`
          : `Joined: ${data.class?.name ?? "class"}. You can continue the school student research flow.`
      );
      setInviteCode("");
    } else {
      setMessage(zh ? "邀请码无效，或当前账号尚未登录。" : "Invalid code, or this account is not signed in.");
    }
    setJoining(false);
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-8">
      <div className="mx-auto max-w-xl">
        <header className="mb-8 flex items-center justify-between border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-lg font-black text-brand-ink">
              R
            </div>
            <div>
              <div className="text-xl font-bold text-brand-ink">Roto for School</div>
              <div className="text-xs text-text-muted">{zh ? "学生入口" : "Student entry"}</div>
            </div>
          </div>
          <Link
            href={`/${locale}/welcome`}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-dim transition-colors hover:border-accent hover:text-accent"
          >
            {zh ? "个人版" : "Personal version"}
          </Link>
        </header>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green/10 text-xl text-green">
            S
          </div>
          <h1 className="text-2xl font-bold text-text">{zh ? "加入学校班级" : "Join a school class"}</h1>
          <p className="mt-2 text-sm leading-relaxed text-text-dim">
            {zh
              ? "请输入老师提供的邀请码。加入后，你的学校老师可以查看你的科研进度，并在需要审核的阶段给出反馈。"
              : "Enter the invite code from your teacher. After joining, your school teacher can view your research progress and give feedback on review-required phases."}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              placeholder={zh ? "例如：A1B2C3D4" : "e.g. A1B2C3D4"}
              className="flex-1 rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-text focus:border-accent focus:outline-none"
            />
            <button
              onClick={joinClass}
              disabled={joining || !inviteCode.trim()}
              className="rounded-xl bg-green px-5 py-3 text-sm font-semibold text-white hover:bg-green/90 disabled:opacity-45"
            >
              {joining ? (zh ? "加入中" : "Joining") : zh ? "加入" : "Join"}
            </button>
          </div>

          {message && <p className="mt-4 rounded-xl bg-surface2 px-4 py-3 text-sm text-text-dim">{message}</p>}

          <div className="mt-6 flex gap-3">
            <Link
              href={`/${locale}/welcome`}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-dim hover:border-accent hover:text-accent"
            >
              {zh ? "继续学生端" : "Continue as student"}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-dim hover:border-accent hover:text-accent"
            >
              {zh ? "登录 / 注册" : "Log in / sign up"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
