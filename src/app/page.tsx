import Link from "next/link";
import RotaAvatar from "@/components/RotaAvatar";

const features = [
  {
    icon: "🧭",
    tone: "bg-purple/25 text-brand-ink",
    title: "Rota 导师引导",
    description:
      "Rota 会先听你在困惑什么，再帮你找到真正卡住的点，而不是一上来就抛一堆标准答案。",
  },
  {
    icon: "🧩",
    tone: "bg-accent/16 text-accent",
    title: "把大问题拆小",
    description:
      "从选题、计划、执行到复盘，复杂的研究流程会被拆成你真的能迈出去的下一步。",
  },
  {
    icon: "📍",
    tone: "bg-green/18 text-green",
    title: "从乱雾里抓重点",
    description:
      "当你脑子很乱、目标很大、节奏失衡时，Rota 会帮你把真正重要的事重新圈出来。",
  },
  {
    icon: "📒",
    tone: "bg-cyan/22 text-brand-sky-deep",
    title: "一路留下成长轨迹",
    description:
      "任务反馈、阶段总结和科研日志会沉淀成一条完整的成长路径，而不只是零散作业。",
  },
];

const stages = [
  {
    step: "01",
    title: "先把你搞清楚",
    description: "从兴趣、能力和时间出发，找到适合你现在起步的研究方向。",
  },
  {
    step: "02",
    title: "再把问题讲清楚",
    description: "把模糊课题变成清晰任务，把“想做”变成“知道怎么做”。",
  },
  {
    step: "03",
    title: "一路盯住执行",
    description: "每一步都有反馈和调整，不让计划只停在纸面上。",
  },
  {
    step: "04",
    title: "最后留下作品",
    description: "把过程沉淀成成果、日志和成长记录，真的看到自己的变化。",
  },
];

export default function Home() {
  return (
    <div className="rota-grid min-h-screen flex flex-col relative overflow-hidden">
      <div className="glow-purple" style={{ top: "-200px", left: "-100px" }} />
      <div className="glow-cyan" style={{ bottom: "-200px", right: "-100px" }} />

      <header className="relative z-10 px-6 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/80 border border-border rota-panel flex items-center justify-center text-lg font-black text-brand-ink">
            R
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">Rota</div>
            <div className="text-xs text-text-muted">AI research mentor</div>
          </div>
        </div>
        <Link
          href="/login"
          className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-2xl transition-colors shadow-lg shadow-accent/20"
        >
          登录 / 注册
        </Link>
      </header>

      <section className="relative z-10 px-6 pb-18 pt-8 md:pt-14">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.04] text-brand-ink">
              Rota 帮你把
              <span className="block bg-gradient-to-r from-brand-sky-deep via-accent to-brand-sun-deep bg-clip-text text-transparent">
                研究这件事，变清楚
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-lg md:text-xl text-text-dim leading-relaxed">
              它不是一个只会给答案的工具，而是一个会听、会拆、会盯节奏的产品导师。
              当你越想越乱的时候，Rota 会先帮你找到真正的问题，再带你迈出下一步。
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="px-8 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-accent/20 text-center"
              >
                进入 Rota
              </Link>
              <a
                href="#features"
                className="px-8 py-3.5 bg-white/78 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-2xl transition-colors text-center rota-panel"
              >
                先看看它怎么帮你
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              {[
                "看清问题",
                "拆出第一步",
                "稳住执行节奏",
                "留下成长轨迹",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border bg-white/72 px-4 py-2 text-text-dim rota-panel"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rota-panel rounded-[32px] p-8 md:p-10 bg-gradient-to-br from-white/90 via-white/80 to-brand-sky-soft/80">
              <div className="flex justify-center">
                <RotaAvatar size="xl" scene="hero" />
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-brand-cloud/72 border border-purple/35 px-4 py-3">
                  <div className="text-sm font-bold text-brand-ink">Rota 的任务</div>
                  <div className="text-sm text-text-dim">
                    把大问题拆小，把乱想法拉实，把“我不行了”翻译成“我到底卡在哪”。
                  </div>
                </div>
                <div className="rounded-2xl bg-brand-sky-soft border border-accent/20 px-4 py-3">
                  <div className="text-sm font-bold text-brand-ink">Rota 的气质</div>
                  <div className="text-sm text-text-dim">
                    看起来软乎乎，脑子却很清楚。平时活泼，讲问题时特别稳。
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -left-2 -bottom-4 rota-panel rounded-2xl px-4 py-3 hidden md:block">
              <div className="text-xs text-text-muted">Rota 常说</div>
              <div className="text-sm font-semibold text-brand-ink">
                “先别急着把问题想大，我们先抓住最会绊你的那一块。”
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 px-6 pb-18">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-brand-ink">
              它不是帮你变忙，而是帮你变清楚
            </h2>
            <p className="mt-3 text-text-dim max-w-2xl mx-auto">
              从选题、计划到执行，Rota 会在最容易乱、最容易卡、最容易想太多的时候，把你重新带回重点。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rota-panel rounded-[28px] p-7 transition-transform hover:-translate-y-1"
              >
                <div
                  className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${feature.tone}`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-brand-ink">{feature.title}</h3>
                <p className="mt-3 text-text-dim leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-18">
        <div className="max-w-6xl mx-auto rota-panel rounded-[32px] p-8 md:p-10 bg-gradient-to-br from-white/92 via-brand-cloud/56 to-brand-sky-soft/70">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-black text-brand-ink">
              先找真问题，再带你走出第一步
            </h2>
            <p className="mt-3 text-text-dim">
              这不是“把所有东西都做一遍”的流程，而是一条真正能帮助中学生起步、推进、坚持下去的路径。
            </p>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-4">
            {stages.map((stage) => (
              <div
                key={stage.step}
                className="rounded-[24px] border border-white/70 bg-white/82 p-5 shadow-sm"
              >
                <div className="text-sm font-black text-accent/70">{stage.step}</div>
                <h3 className="mt-2 text-lg font-black text-brand-ink">{stage.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-dim">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto text-center rota-panel rounded-[32px] p-10 bg-gradient-to-br from-brand-sky-soft via-white to-brand-cloud/72">
          <h2 className="text-3xl md:text-4xl font-black text-brand-ink">
            帮你在混乱里看见重点，在焦虑里找到下一步
          </h2>
          <p className="mt-4 text-text-dim max-w-2xl mx-auto">
            如果你准备好开始，Rota 会从第一段对话开始陪你。不是陪你空想，而是陪你真的往前走。
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/login"
              className="inline-block px-8 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-accent/20"
            >
              开始使用 Rota
            </Link>
            <a
              href="#features"
              className="inline-block px-8 py-3.5 bg-white/82 border border-border text-text-dim font-semibold rounded-2xl transition-colors hover:border-accent hover:text-accent"
            >
              回看核心能力
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 pb-8 text-center">
        <span className="inline-block px-4 py-1.5 bg-white/76 border border-border text-accent text-xs font-semibold rounded-full rota-panel">
          Rota · AI 科研导师平台
        </span>
      </footer>
    </div>
  );
}
