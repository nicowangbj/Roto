"use client";

import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto py-12">
      {/* Hero section with IP placeholder */}
      <div className="text-center mb-12">
        <div className="img-placeholder mx-auto mb-6" style={{ width: 120, height: 120, borderRadius: "50%" }}>
          <span className="icon">🧑‍🔬</span>
          <span className="spec">AI导师IP形象 · 120×120</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">欢迎来到研途</h1>
        <p className="text-text-dim text-lg max-w-md mx-auto">
          我是你的 AI 科研导师，将陪伴你完成一段精彩的研究旅程。
          准备好了吗？
        </p>
      </div>

      {/* Path selection — two distinct cards referencing product spec */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => router.push("/topic/chat")}
          className="group relative bg-white rounded-2xl border border-border p-8 text-left hover:border-purple hover:shadow-lg hover:shadow-purple/5 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple to-accent rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 rounded-2xl bg-purple/10 flex items-center justify-center text-2xl mb-5">
            🧭
          </div>
          <h3 className="text-lg font-bold mb-2 group-hover:text-purple transition-colors">
            我还没有课题
          </h3>
          <p className="text-sm text-text-dim leading-relaxed">
            AI 导师将通过对话了解你的兴趣和能力，一步步帮你找到适合的研究课题
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-purple opacity-0 group-hover:opacity-100 transition-opacity">
            开始探索 <span>→</span>
          </div>
        </button>

        <button
          onClick={() => router.push("/topic/confirm?path=has_topic")}
          className="group relative bg-white rounded-2xl border border-border p-8 text-left hover:border-green hover:shadow-lg hover:shadow-green/5 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green to-cyan rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 rounded-2xl bg-green/10 flex items-center justify-center text-2xl mb-5">
            🎯
          </div>
          <h3 className="text-lg font-bold mb-2 group-hover:text-green transition-colors">
            我已经有课题了
          </h3>
          <p className="text-sm text-text-dim leading-relaxed">
            直接填写你的课题信息，我们帮你制定研究计划并开始执行
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-green opacity-0 group-hover:opacity-100 transition-opacity">
            填写课题 <span>→</span>
          </div>
        </button>
      </div>
    </div>
  );
}
