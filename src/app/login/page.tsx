"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RotaAvatar from "@/components/RotaAvatar";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { name, email, password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "操作失败");
        return;
      }

      router.push("/welcome");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rota-grid min-h-screen flex flex-col relative overflow-hidden">
      <div className="glow-purple" style={{ top: "-200px", left: "-100px" }} />
      <div
        className="glow-cyan"
        style={{ bottom: "-200px", right: "-100px" }}
      />

      <header className="relative z-10 px-6 md:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/80 border border-border rota-panel flex items-center justify-center text-lg font-black text-brand-ink">
            R
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-brand-ink">Rota</div>
            <div className="text-xs text-text-muted">AI research mentor</div>
          </div>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10 px-6 pb-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-[1.02fr_0.98fr] gap-8 items-center">
          <section className="hidden lg:block">
            <div className="rota-panel rounded-[32px] p-10 bg-gradient-to-br from-white/90 via-brand-cloud/55 to-brand-sky-soft/80">
              <div className="inline-flex rounded-full bg-purple/22 px-4 py-2 text-sm font-semibold text-brand-ink">
                欢迎来到 Rota
              </div>
              <h1 className="mt-5 text-5xl font-black leading-[1.06] text-brand-ink">
                把乱糟糟的想法，
                <span className="block bg-gradient-to-r from-brand-sky-deep to-brand-sun-deep bg-clip-text text-transparent">
                  变成能走下去的研究路径
                </span>
              </h1>
              <p className="mt-5 text-lg text-text-dim max-w-xl">
                Rota 会先帮你认出真正的问题，再陪你把选题、计划和执行一步步拉清楚。
                它不是来制造压力的，是来帮你稳住节奏的。
              </p>

              <div className="mt-8 flex items-center gap-6">
                <RotaAvatar size="lg" scene="signin" className="shrink-0" />
                <div className="space-y-3">
                  {[
                    "先听，再判断，不乱抛答案",
                    "把大目标拆成你今天就能开始的小步",
                    "越焦虑的时候，越帮你抓重点",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/70 bg-white/82 px-4 py-3 text-sm text-text-dim shadow-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-[24px] border border-accent/12 bg-brand-sky-soft px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  Rota 常说
                </div>
                <div className="mt-2 text-base font-semibold text-brand-ink">
                  “先别忙着给自己下结论。问题都没看清呢，怎么能先判自己不行？”
                </div>
              </div>
            </div>
          </section>

          <div className="w-full max-w-md lg:ml-auto">
            <div className="rota-panel rounded-[32px] p-8 bg-white/90">
              <div className="mb-6 lg:hidden flex items-center gap-3">
                <RotaAvatar size="sm" scene="signin" />
                <div>
                  <div className="text-lg font-bold text-brand-ink">Rota</div>
                  <div className="text-sm text-text-dim">
                    帮你把研究这件事变清楚
                  </div>
                </div>
              </div>

              <div className="flex bg-surface2 rounded-2xl p-1.5 mb-8">
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  mode === "login"
                    ? "bg-white text-accent shadow-sm"
                    : "text-text-muted hover:text-text-dim"
                }`}
              >
                登录
              </button>
              <button
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  mode === "register"
                    ? "bg-white text-accent shadow-sm"
                    : "text-text-muted hover:text-text-dim"
                }`}
              >
                注册
              </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-text-dim mb-1.5"
                    >
                      姓名
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="请输入你的姓名"
                      required
                      className="w-full px-4 py-3 bg-surface2 border border-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-text-dim mb-1.5"
                  >
                    邮箱
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱地址"
                    required
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-text-dim mb-1.5"
                  >
                    密码
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === "register" ? "至少 6 个字符" : "请输入密码"
                    }
                    required
                    minLength={mode === "register" ? 6 : undefined}
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                  />
                </div>

                {error && (
                  <div className="text-sm text-rose bg-rose/5 border border-rose/20 rounded-2xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-accent/20"
                >
                  {loading
                    ? "处理中..."
                    : mode === "login"
                      ? "登录"
                      : "注册"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-text-muted">
                {mode === "login"
                  ? "还没有账号？点击上方「注册」创建"
                  : "已有账号？点击上方「登录」进入"}
              </p>
            </div>

            <div className="text-center mt-6">
              <Link
                href="/"
                className="text-sm text-text-muted hover:text-accent transition-colors"
              >
                ← 返回首页
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
