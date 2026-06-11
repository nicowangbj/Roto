"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  promptTemplate: string;
  isConfigured: boolean;
}

export default function StrategyEditPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [promptTemplate, setPromptTemplate] = useState("");
  const [description, setDescription] = useState("");
  const [triggerTiming, setTriggerTiming] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const typeConfig: Record<string, { label: string; icon: string; style: React.CSSProperties }> = {
    conversation: { label: t("typeConversation"), icon: "💬", style: { color: "#2563eb", background: "#eff6ff" } },
    generation: { label: t("typeGeneration"), icon: "✨", style: { color: "#7c3aed", background: "#f5f3ff" } },
    evaluation: { label: t("typeEvaluation"), icon: "📊", style: { color: "#ea580c", background: "#fff7ed" } },
    computation: { label: t("typeComputation"), icon: "⚙️", style: { color: "#475569", background: "#f1f5f9" } },
  };

  useEffect(() => {
    fetch(`/api/strategies/${code}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setStrategy(data);
        setPromptTemplate(data.promptTemplate || "");
        setDescription(data.description || "");
        setTriggerTiming(data.triggerTiming || "");
      });
  }, [code]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/strategies/${code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptTemplate, description, triggerTiming }),
    })
      .then((r) => r.json())
      .then((data) => {
        setStrategy(data);
        setPromptTemplate(data.promptTemplate || "");
        setDescription(data.description || "");
        setTriggerTiming(data.triggerTiming || "");
      });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = "w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors";

  if (!strategy) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/strategies"
        className="text-text-dim hover:text-accent text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("backList")}
      </Link>

      <div className="flex items-center gap-3 mb-8 mt-4 flex-wrap">
        <span className="text-sm font-bold px-3 py-1 rounded-lg bg-accent/10 text-accent">
          {strategy.code}
        </span>
        <h1 className="text-2xl font-bold text-text">{strategy.name}</h1>
        {(() => {
          const sType = typeConfig[strategy.strategyType] || { label: strategy.strategyType, icon: "📄", style: { color: "var(--color-text-muted)", background: "var(--color-surface2)" } };
          return (
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={sType.style}>
              {sType.icon} {sType.label}
            </span>
          );
        })()}
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

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text mb-2">{t("descLabel")}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder={t("descPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-2">{t("triggerTitle")}</label>
            <input
              type="text"
              value={triggerTiming}
              onChange={(e) => setTriggerTiming(e.target.value)}
              className={inputClass}
              placeholder={t("triggerPlaceholder")}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <label className="block text-sm font-semibold text-text mb-2">{t("promptTitle")}</label>
          <p className="text-xs text-text-muted mb-3">
            {t("promptHint")}
          </p>
          <textarea
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            rows={20}
            className={`${inputClass} font-mono leading-relaxed resize-y`}
            placeholder={t("promptPlaceholder")}
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-accent/20"
          >
            {saving ? tc("saving") : t("saveBtn")}
          </button>
          {saved && (
            <span className="text-sm font-semibold text-green">{tc("saved")}</span>
          )}
          <button
            onClick={() => router.push("/admin/strategies")}
            className="px-6 py-2.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
          >
            {tc("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
