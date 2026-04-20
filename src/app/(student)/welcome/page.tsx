"use client";

import { useRouter } from "next/navigation";
import RotaAvatar from "@/components/RotaAvatar";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      <div className="rota-panel rounded-[32px] p-8 md:p-10 bg-gradient-to-br from-white/92 via-brand-cloud/58 to-brand-sky-soft/78">
        <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
          <div className="flex justify-center md:justify-start">
            <RotaAvatar size="xl" scene="welcome" />
          </div>
          <div>
            <div className="inline-flex rounded-full bg-purple/22 px-4 py-2 text-sm font-semibold text-brand-ink">
              欢迎来到 Rota
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-brand-ink">
              研究还没开始，
              <span className="block text-accent">我们先把方向弄清楚</span>
            </h1>
            <p className="mt-4 text-lg text-text-dim leading-relaxed">
              我是 Rota。你可以把我当成一个会陪你拆问题、盯节奏、顺手还爱吃两口脆云片的小导师。
              你现在不用什么都准备好，我们先选一个更适合你的起点。
            </p>
            <div className="mt-6 rounded-[24px] border border-accent/12 bg-white/76 px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                Rota 先说一句
              </div>
              <div className="mt-2 text-base font-semibold text-brand-ink">
                “别一上来就想把整件事搞懂。你先告诉我，你现在是没课题，还是课题已经有了但不知道怎么往下走？”
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => router.push("/topic/chat")}
          className="group relative rota-panel rounded-[28px] p-8 text-left hover:-translate-y-1 transition-all bg-white/88"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple to-accent rounded-t-[28px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 rounded-2xl bg-purple/20 flex items-center justify-center text-2xl mb-5">
            🧭
          </div>
          <h3 className="text-xl font-black mb-2 group-hover:text-brand-ink transition-colors">
            我还没有课题
          </h3>
          <p className="text-sm text-text-dim leading-relaxed">
            Rota 会先跟你聊兴趣、能力和时间，再帮你把“我想做点什么”变成一个真的能开始的研究方向。
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-brand-ink opacity-0 group-hover:opacity-100 transition-opacity">
            让 Rota 带我找方向 <span>→</span>
          </div>
        </button>

        <button
          onClick={() => router.push("/topic/confirm?path=has_topic")}
          className="group relative rota-panel rounded-[28px] p-8 text-left hover:-translate-y-1 transition-all bg-white/88"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent to-cyan rounded-t-[28px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 rounded-2xl bg-accent/12 flex items-center justify-center text-2xl mb-5">
            🎯
          </div>
          <h3 className="text-xl font-black mb-2 group-hover:text-accent transition-colors">
            我已经有课题了
          </h3>
          <p className="text-sm text-text-dim leading-relaxed">
            你直接把现有课题交给 Rota，我们一起把它压实成可执行的研究计划，再正式开跑。
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
            让 Rota 帮我落计划 <span>→</span>
          </div>
        </button>
      </div>
    </div>
  );
}
