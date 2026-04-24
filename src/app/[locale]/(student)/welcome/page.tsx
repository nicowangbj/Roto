"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import RotoAvatar from "@/components/RotoAvatar";

export default function WelcomePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("welcome");

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      <div className="roto-panel rounded-[32px] p-8 md:p-10 bg-gradient-to-br from-white/92 via-brand-cloud/58 to-brand-sky-soft/78">
        <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
          <div className="flex justify-center md:justify-start">
            <RotoAvatar size="xl" scene="welcome" />
          </div>
          <div>
            <div className="inline-flex rounded-full bg-purple/22 px-4 py-2 text-sm font-semibold text-brand-ink">
              {t("badge")}
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-brand-ink">
              {t("title1")}
              <span className="block text-accent">{t("title2")}</span>
            </h1>
            <p className="mt-4 text-lg text-text-dim leading-relaxed">
              {t("intro")}
            </p>
            <div className="mt-6 rounded-[24px] border border-accent/12 bg-white/76 px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {t("rotaSays")}
              </div>
              <div className="mt-2 text-base font-semibold text-brand-ink">
                {t("rotaQuote")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => router.push(`/${locale}/topic/chat`)}
          className="group relative roto-panel rounded-[28px] p-8 text-left hover:-translate-y-1 transition-all bg-white/88"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple to-accent rounded-t-[28px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 rounded-2xl bg-purple/20 flex items-center justify-center text-2xl mb-5">
            🧭
          </div>
          <h3 className="text-xl font-black mb-2 group-hover:text-brand-ink transition-colors">
            {t("noTopic")}
          </h3>
          <p className="text-sm text-text-dim leading-relaxed">
            {t("noTopicDesc")}
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-brand-ink opacity-0 group-hover:opacity-100 transition-opacity">
            {t("noTopicCta")} <span>→</span>
          </div>
        </button>

        <button
          onClick={() => router.push(`/${locale}/topic/confirm?path=has_topic`)}
          className="group relative roto-panel rounded-[28px] p-8 text-left hover:-translate-y-1 transition-all bg-white/88"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent to-cyan rounded-t-[28px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 rounded-2xl bg-accent/12 flex items-center justify-center text-2xl mb-5">
            🎯
          </div>
          <h3 className="text-xl font-black mb-2 group-hover:text-accent transition-colors">
            {t("hasTopic")}
          </h3>
          <p className="text-sm text-text-dim leading-relaxed">
            {t("hasTopicDesc")}
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
            {t("hasTopicCta")} <span>→</span>
          </div>
        </button>
      </div>
    </div>
  );
}
