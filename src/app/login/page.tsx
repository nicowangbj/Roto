"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative glows */}
      <div className="glow-purple" style={{ top: "-200px", left: "-100px" }} />
      <div
        className="glow-cyan"
        style={{ bottom: "-200px", right: "-100px" }}
      />

      {/* Header */}
      <header className="relative z-10 px-8 py-5 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          研途 <span className="text-accent">ResearchFlow</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-6">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-border shadow-xl shadow-accent/5 p-8">
            {/* Tabs */}
            <div className="flex bg-surface2 rounded-xl p-1 mb-8">
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
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
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  mode === "register"
                    ? "bg-white text-accent shadow-sm"
                    : "text-text-muted hover:text-text-dim"
                }`}
              >
                注册
              </button>
            </div>

            {/* Form */}
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
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
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
                  className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
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
                  className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                />
              </div>

              {error && (
                <div className="text-sm text-rose bg-rose/5 border border-rose/20 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
              >
                {loading
                  ? "处理中..."
                  : mode === "login"
                    ? "登录"
                    : "注册"}
              </button>
            </form>

            {/* Footer hint */}
            <p className="mt-6 text-center text-xs text-text-muted">
              {mode === "login"
                ? "还没有账号？点击上方「注册」创建"
                : "已有账号？点击上方「登录」进入"}
            </p>
          </div>

          {/* Back to landing */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-sm text-text-muted hover:text-accent transition-colors"
            >
              ← 返回首页
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
