"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface Strategy {
  id: string;
  code: string;
  name: string;
  module: string;
  strategyType: string;
  description: string | null;
  triggerTiming: string | null;
  isConfigured: boolean;
}

export default function StrategiesPage() {
  const t = useTranslations("admin");
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const moduleConfig: Record<string, { label: string; style: React.CSSProperties }> = {
    topic_selection: { label: t("moduleTopicSelection"), style: { color: "var(--color-purple)", background: "color-mix(in srgb, var(--color-purple) 10%, transparent)" } },
    plan_display: { label: t("modulePlanDisplay"), style: { color: "var(--color-cyan)", background: "color-mix(in srgb, var(--color-cyan) 10%, transparent)" } },
    plan_execution: { label: t("modulePlanExecution"), style: { color: "var(--color-green)", background: "color-mix(in srgb, var(--color-green) 10%, transparent)" } },
    plan_adjustment: { label: t("modulePlanAdjustment"), style: { color: "var(--color-amber)", background: "color-mix(in srgb, var(--color-amber) 10%, transparent)" } },
    journal: { label: t("moduleJournal"), style: { color: "var(--color-rose)", background: "color-mix(in srgb, var(--color-rose) 10%, transparent)" } },
  };

  const typeConfig: Record<string, { label: string; icon: string; style: React.CSSProperties }> = {
    conversation: { label: t("typeConversation"), icon: "💬", style: { color: "#2563eb", background: "#eff6ff" } },
    generation: { label: t("typeGeneration"), icon: "✨", style: { color: "#7c3aed", background: "#f5f3ff" } },
    evaluation: { label: t("typeEvaluation"), icon: "📊", style: { color: "#ea580c", background: "#fff7ed" } },
    computation: { label: t("typeComputation"), icon: "⚙️", style: { color: "#475569", background: "#f1f5f9" } },
  };

  useEffect(() => {
    fetch("/api/strategies", { cache: "no-store" })
      .then((r) => r.json())
      .then(setStrategies);
  }, []);

  const filtered =
    filter === "all"
      ? strategies
      : strategies.filter((s) => s.module === filter);

  const configuredCount = strategies.filter((s) => s.isConfigured).length;

  return (
    <div>
      {/* Header with stats */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-text">{t("strategiesTitle")}</h1>
        <div className="flex items-center gap-4 text-sm text-text-dim">
          <span>{t("totalCount", { n: strategies.length })}</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green" />
            {t("configured", { n: configuredCount })}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber" />
            {t("pending", { n: strategies.length - configuredCount })}
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-accent text-white"
              : "bg-white border border-border text-text-dim hover:border-accent hover:text-accent"
          }`}
        >
          {t("filterAll")}
        </button>
        {Object.entries(moduleConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors bg-white border border-border text-text-dim hover:border-accent hover:text-accent"
            style={filter === key ? config.style : undefined}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Strategy list */}
      <div className="grid gap-3">
        {filtered.map((strategy) => {
          const mod = moduleConfig[strategy.module] || {
            label: strategy.module,
            style: { color: "var(--color-text-muted)", background: "var(--color-surface2)" },
          };
          const sType = typeConfig[strategy.strategyType] || {
            label: strategy.strategyType,
            icon: "📄",
            style: { color: "var(--color-text-muted)", background: "var(--color-surface2)" },
          };
          return (
            <Link
              key={strategy.code}
              href={`/admin/strategies/${strategy.code}`}
              className="block bg-white rounded-2xl border border-border p-5 hover:border-accent hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-accent/10 text-accent">
                      {strategy.code}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={mod.style}>
                      {mod.label}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={sType.style}>
                      {sType.icon} {sType.label}
                    </span>
                    <span
                      className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={strategy.isConfigured
                        ? { color: "var(--color-green)", background: "color-mix(in srgb, var(--color-green) 10%, transparent)" }
                        : { color: "var(--color-amber)", background: "color-mix(in srgb, var(--color-amber) 10%, transparent)" }
                      }
                    >
                      {strategy.isConfigured ? t("statusConfigured") : t("statusPlaceholder")}
                    </span>
                  </div>
                  <h3 className="font-bold group-hover:text-accent transition-colors text-text">
                    {strategy.name}
                  </h3>
                  {strategy.description && (
                    <p className="text-sm text-text-dim mt-1">{strategy.description}</p>
                  )}
                  {strategy.triggerTiming && (
                    <p className="text-xs text-text-muted mt-2">
                      {t("triggerLabel", { timing: strategy.triggerTiming })}
                    </p>
                  )}
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted group-hover:text-accent transition-colors mt-1 ml-4 shrink-0">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
