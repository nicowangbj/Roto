"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

const typeConfig: Record<string, { label: string; icon: string; style: React.CSSProperties }> = {
  conversation: { label: "对话策略", icon: "💬", style: { color: "#2563eb", background: "#eff6ff" } },
  generation: { label: "生成策略", icon: "✨", style: { color: "#7c3aed", background: "#f5f3ff" } },
  evaluation: { label: "评估策略", icon: "📊", style: { color: "#ea580c", background: "#fff7ed" } },
  computation: { label: "计算策略", icon: "⚙️", style: { color: "#475569", background: "#f1f5f9" } },
};

export default function StrategyEditPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [promptTemplate, setPromptTemplate] = useState("");
  const [description, setDescription] = useState("");
  const [triggerTiming, setTriggerTiming] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/strategies/${code}`)
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
        返回列表
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
          {strategy.isConfigured ? "已配置" : "占位中"}
        </span>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text mb-2">策略描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="策略功能描述"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-2">触发时机</label>
            <input
              type="text"
              value={triggerTiming}
              onChange={(e) => setTriggerTiming(e.target.value)}
              className={inputClass}
              placeholder="什么时候触发这个策略"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <label className="block text-sm font-semibold text-text mb-2">Prompt 模板</label>
          <p className="text-xs text-text-muted mb-3">
            这是发送给 AI 的系统指令。留空时将使用内置的默认占位策略。配置后系统将使用此处的内容。
          </p>
          <textarea
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            rows={20}
            className={`${inputClass} font-mono leading-relaxed resize-y`}
            placeholder={`输入 Prompt 模板...\n\n例如：\n你是一位温和且专业的科研导师，正在和一位高中生进行沟通。你的目标是...`}
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-accent/20"
          >
            {saving ? "保存中..." : "保存策略"}
          </button>
          {saved && (
            <span className="text-sm font-semibold text-green">保存成功！</span>
          )}
          <button
            onClick={() => router.push("/admin/strategies")}
            className="px-6 py-2.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
