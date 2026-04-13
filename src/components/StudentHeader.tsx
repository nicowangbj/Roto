"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentHeader() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.name) setUserName(data.name);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/map" className="text-lg font-bold tracking-tight">
          研途 <span className="text-accent">ResearchFlow</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/map"
            className="px-3 py-1.5 text-sm text-text-dim hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
          >
            科研地图
          </Link>
          <Link
            href="/journal"
            className="px-3 py-1.5 text-sm text-text-dim hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
          >
            科研日志
          </Link>
          <Link
            href="/adjust"
            className="px-3 py-1.5 text-sm text-text-dim hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
          >
            调整计划
          </Link>
          <Link
            href="/profile"
            className="px-3 py-1.5 text-sm text-text-dim hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
          >
            个人中心
          </Link>
          <div className="w-px h-5 bg-border mx-2" />
          {userName && (
            <span className="text-sm text-text-muted mr-1">{userName}</span>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-3 py-1.5 text-sm text-text-muted hover:text-rose hover:bg-rose/5 rounded-lg transition-colors"
          >
            {loggingOut ? "退出中..." : "退出"}
          </button>
        </nav>
      </div>
    </header>
  );
}
