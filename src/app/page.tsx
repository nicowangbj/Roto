import Link from "next/link";

const features = [
  {
    icon: "🤖",
    color: "purple",
    title: "AI 科研导师",
    description:
      "通过苏格拉底式对话，AI 导师帮助你发现兴趣方向、选择课题，并在整个研究过程中提供个性化指导。",
  },
  {
    icon: "🗺️",
    color: "accent",
    title: "结构化科研流程",
    description:
      "将复杂的研究任务拆解为阶段和每周任务，通过可视化科研地图让你的研究之旅清晰可见。",
  },
  {
    icon: "📊",
    color: "green",
    title: "智能进度追踪",
    description:
      "AI 自动评估每次任务提交，给出 A-D 评级和改进建议，帮助你持续提升研究质量。",
  },
  {
    icon: "📔",
    color: "cyan",
    title: "科研日志",
    description:
      "系统自动生成第一人称科研日志，记录你的研究历程、思考和成长，成为宝贵的学习档案。",
  },
];

const colorMap: Record<string, string> = {
  purple: "bg-purple/10 hover:border-purple",
  accent: "bg-accent/10 hover:border-accent",
  green: "bg-green/10 hover:border-green",
  cyan: "bg-cyan/10 hover:border-cyan",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative glows */}
      <div className="glow-purple" style={{ top: "-200px", left: "-100px" }} />
      <div className="glow-cyan" style={{ bottom: "-200px", right: "-100px" }} />

      {/* Header */}
      <header className="relative z-10 px-8 py-5 flex items-center justify-between">
        <div className="text-lg font-bold tracking-tight">
          研途 <span className="text-accent">ResearchFlow</span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
        >
          登录 / 注册
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-16 pb-20 px-6">
        <div className="text-center max-w-2xl mx-auto">
          {/* Icon cluster */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-purple/10 flex items-center justify-center text-2xl">
              🔬
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-lg">
              📊
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green/10 flex items-center justify-center text-xl">
              🎯
            </div>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            研途{" "}
            <span className="bg-gradient-to-r from-accent to-cyan bg-clip-text text-transparent">
              ResearchFlow
            </span>
          </h1>
          <p className="text-xl text-text-dim mb-2">AI 科研规划管理导师</p>
          <p className="text-text-muted mb-10 max-w-lg mx-auto leading-relaxed">
            让每个孩子都能在 AI 时代探索自己感兴趣的课题。从选题到完成，AI
            导师全程陪伴，让科研之旅变得清晰、有趣、高效。
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
            >
              开始研究之旅
            </Link>
            <a
              href="#features"
              className="px-8 py-3 bg-surface border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
            >
              了解更多
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">
            为什么选择研途？
          </h2>
          <p className="text-text-muted text-center mb-12 max-w-lg mx-auto">
            专为中学生设计的 AI 科研辅导平台，覆盖从选题到结项的全流程
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-border p-7 hover:shadow-lg transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${colorMap[f.color].split(" ")[0]} flex items-center justify-center text-xl mb-4`}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-text-dim leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            研究之旅的四个阶段
          </h2>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "选题探索",
                desc: "AI 导师通过对话了解你的兴趣和能力，帮助你找到最适合的研究课题",
                color: "text-purple",
              },
              {
                step: "02",
                title: "计划制定",
                desc: "自动生成分阶段研究计划，将大目标拆解为可执行的每周任务",
                color: "text-accent",
              },
              {
                step: "03",
                title: "执行研究",
                desc: "逐步完成任务，获得 AI 实时指导与评级反馈，持续改进研究成果",
                color: "text-green",
              },
              {
                step: "04",
                title: "总结成果",
                desc: "完成研究报告，获得自动生成的科研日志，记录完整的成长轨迹",
                color: "text-cyan",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-5 bg-white rounded-2xl border border-border p-6"
              >
                <div
                  className={`text-3xl font-extrabold ${item.color} opacity-60 shrink-0`}
                >
                  {item.step}
                </div>
                <div>
                  <h3 className="text-base font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-text-dim leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-accent/5 to-purple/5 rounded-3xl border border-accent/10 p-12">
            <h2 className="text-2xl font-bold mb-3">准备好开始了吗？</h2>
            <p className="text-text-muted mb-8">
              注册账号，开启属于你的 AI 科研之旅
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
            >
              免费注册
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 pb-8 text-center">
        <span className="inline-block px-4 py-1.5 bg-accent/8 text-accent text-xs font-semibold rounded-full">
          v1.0 · AI 科研辅导平台
        </span>
      </footer>
    </div>
  );
}
