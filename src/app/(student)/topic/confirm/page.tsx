"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState(searchParams.get("name") || "");
  const [field, setField] = useState("");
  const [description, setDescription] = useState("");
  const [outputFormat, setOutputFormat] = useState(searchParams.get("output") || "研究报告");
  const [duration, setDuration] = useState(searchParams.get("duration") || "12周");
  const [weeklyHours, setWeeklyHours] = useState("5小时");
  const [submitting, setSubmitting] = useState(false);
  const path = searchParams.get("path") || "no_topic";

  const handleConfirm = async () => {
    if (!name.trim()) return;
    setSubmitting(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicName: name,
        field,
        description,
        outputFormat,
        duration,
        weeklyHours,
        selectedPath: path,
      }),
    });

    const project = await res.json();
    router.push(`/plan/overview?projectId=${project.id}`);
  };

  const inputClass = "w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with decorative element */}
      <div className="relative mb-10">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-accent/10 to-purple/5 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center text-lg">✅</div>
            <h1 className="text-2xl font-bold text-text">确认你的课题</h1>
          </div>
          <p className="text-text-dim ml-[52px]">
            {path === "has_topic"
              ? "请填写你已有的课题信息"
              : "确认以下信息，修改后点击确认开始"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-text mb-2">
            课题名称 <span className="text-rose">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="输入课题名称"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-2">
            研究领域
          </label>
          <input
            type="text"
            value={field}
            onChange={(e) => setField(e.target.value)}
            className={inputClass}
            placeholder="例如：心理学、环境科学、计算机科学"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-2">
            课题描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="简要描述你想要研究的内容和目标"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-sm font-semibold text-text mb-2">
              产出形式
            </label>
            <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className={inputClass}>
              <option value="研究报告">研究报告</option>
              <option value="论文">论文</option>
              <option value="实验报告">实验报告</option>
              <option value="调研报告">调研报告</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-2">
              时间跨度
            </label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass}>
              <option value="6周">6周</option>
              <option value="8周">8周</option>
              <option value="10周">10周</option>
              <option value="12周">12周</option>
              <option value="16周">16周</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-2">
              每周投入
            </label>
            <select value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} className={inputClass}>
              <option value="2小时">2小时</option>
              <option value="3小时">3小时</option>
              <option value="5小时">5小时</option>
              <option value="8小时">8小时</option>
              <option value="10小时">10小时</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={!name.trim() || submitting}
        className="w-full mt-8 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-accent/20"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            正在生成研究计划...
          </span>
        ) : (
          "确认课题，开始规划"
        )}
      </button>
    </div>
  );
}

export default function TopicConfirmPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <ConfirmContent />
    </Suspense>
  );
}
