"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getTopicDraft, saveTopicDraft, clearTopicDraft } from "@/lib/topic-draft";

function ConfirmContent() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const t = useTranslations("topicConfirm");

  const draft = typeof window !== "undefined" ? getTopicDraft() : null;
  const [name, setName] = useState(searchParams.get("name") || draft?.confirmForm.name || "");
  const [field, setField] = useState(draft?.confirmForm.field || "");
  const [description, setDescription] = useState(searchParams.get("description") || draft?.confirmForm.description || "");
  const [outputFormat, setOutputFormat] = useState(searchParams.get("output") || draft?.confirmForm.outputFormat || t("outputReport"));
  const [duration, setDuration] = useState(searchParams.get("duration") || draft?.confirmForm.duration || t("duration12"));
  const [weeklyHours, setWeeklyHours] = useState(draft?.confirmForm.weeklyHours || t("hours5"));
  const [submitting, setSubmitting] = useState(false);
  const path = searchParams.get("path") || "no_topic";

  // Persist form changes to draft.
  useEffect(() => {
    saveTopicDraft({ confirmForm: { name, field, description, outputFormat, duration, weeklyHours } });
  }, [name, field, description, outputFormat, duration, weeklyHours]);

  const handleConfirm = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    const selectedReferences =
      draft?.selectedRefs
        .map((index) => draft.references[index]?.title)
        .filter((title): title is string => Boolean(title)) ?? [];

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-locale": locale },
      body: JSON.stringify({
        topicName: name,
        field,
        description,
        outputFormat,
        duration,
        weeklyHours,
        selectedPath: path,
        conversationId: draft?.conversationId,
        userProfile: draft?.profile,
        selectedKeywords: draft?.selectedKeywords ?? [],
        selectedReferences,
      }),
    });

    const project = await res.json();
    clearTopicDraft();
    router.push(`/${locale}/plan/overview?projectId=${project.id}`);
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
            <h1 className="text-2xl font-bold text-text">{t("fieldTopic")}</h1>
          </div>
          <p className="text-text-dim ml-[52px]">
            {path === "has_topic"
              ? t("titleHasTopic")
              : t("titleConfirm")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-text mb-2">
            {t("fieldTopicRequired")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder={t("topicPlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-2">
            {t("fieldField")}
          </label>
          <input
            type="text"
            value={field}
            onChange={(e) => setField(e.target.value)}
            className={inputClass}
            placeholder={t("fieldPlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-2">
            {t("fieldDescription")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder={t("descPlaceholder")}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-sm font-semibold text-text mb-2">
              {t("fieldOutput")}
            </label>
            <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className={inputClass}>
              <option value={t("outputReport")}>{t("outputReport")}</option>
              <option value={t("outputPaper")}>{t("outputPaper")}</option>
              <option value={t("outputExperiment")}>{t("outputExperiment")}</option>
              <option value={t("outputSurvey")}>{t("outputSurvey")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-2">
              {t("fieldDuration")}
            </label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass}>
              <option value={t("duration6")}>{t("duration6")}</option>
              <option value={t("duration8")}>{t("duration8")}</option>
              <option value={t("duration10")}>{t("duration10")}</option>
              <option value={t("duration12")}>{t("duration12")}</option>
              <option value={t("duration16")}>{t("duration16")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-2">
              {t("fieldHours")}
            </label>
            <select value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} className={inputClass}>
              <option value={t("hours2")}>{t("hours2")}</option>
              <option value={t("hours3")}>{t("hours3")}</option>
              <option value={t("hours5")}>{t("hours5")}</option>
              <option value={t("hours8")}>{t("hours8")}</option>
              <option value={t("hours10")}>{t("hours10")}</option>
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
            {t("generating")}
          </span>
        ) : (
          t("confirm")
        )}
      </button>
    </div>
  );
}

export default function TopicConfirmPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">...</div></div>}>
      <ConfirmContent />
    </Suspense>
  );
}
