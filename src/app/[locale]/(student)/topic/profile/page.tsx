"use client";

import { useCallback, useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { saveTopicDraft } from "@/lib/topic-draft";

interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  description: string;
}

interface ProfileReport {
  profile: string;
  interests: string[];
  skills: string[];
  timeCommitment: string;
  preferences: string;
}

function ProfileContent() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("topicProfile");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const isQuickStart = searchParams.get("quickStart") === "1";
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileReport | null>(() => ({
    profile: t("defaultProfile"),
    interests: t("defaultInterests").split(/[,，]\s*/),
    skills: t("defaultSkills").split(/[,，]\s*/),
    timeCommitment: t("defaultTime"),
    preferences: t("defaultPreference"),
  }));

  const [showSupplement, setShowSupplement] = useState(false);
  const [supplementText, setSupplementText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeProfileReport = useCallback((
    parsed: Record<string, unknown>,
    fallbackText: string
  ): ProfileReport => {
    const summary =
      typeof parsed.profile === "string"
        ? parsed.profile
        : typeof parsed.summary === "string"
          ? parsed.summary
          : typeof parsed.personality === "string"
            ? parsed.personality
            : fallbackText;

    const weeklyHours =
      typeof parsed.weeklyHours === "number"
        ? `${parsed.weeklyHours} ${locale === "zh" ? "小时/周" : "hours/week"}`
        : typeof parsed.weeklyHours === "string"
          ? parsed.weeklyHours
          : "";

    const timeParts = [
      typeof parsed.timeCommitment === "string" ? parsed.timeCommitment : "",
      typeof parsed.preferredDuration === "string" ? parsed.preferredDuration : "",
      weeklyHours,
    ].filter(Boolean);

    const preferenceParts = [
      typeof parsed.preferences === "string" ? parsed.preferences : "",
      typeof parsed.outputPreference === "string" ? parsed.outputPreference : "",
    ].filter(Boolean);

    return {
      profile: summary,
      interests: Array.isArray(parsed.interests)
        ? parsed.interests.filter((item): item is string => typeof item === "string")
        : [],
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((item): item is string => typeof item === "string")
        : [],
      timeCommitment: timeParts.join(" · ") || t("defaultTime"),
      preferences: preferenceParts.join(" · ") || t("defaultPreference"),
    };
  }, [locale, t]);

  useEffect(() => {
    if (!conversationId) return;
    async function generateProfile() {
      setLoading(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-locale": locale },
          body: JSON.stringify({
            strategyCode: "AI-S02",
            conversationId,
            context: `Please generate a user profile report based on the conversation`,
          }),
        });
        const data = await res.json();
        const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const normalized = normalizeProfileReport(parsed, data.result);
          setProfile(normalized);
          saveTopicDraft({ conversationId, profile: normalized });
        }
      } catch {
        // keep default profile
      }
      setLoading(false);
    }
    generateProfile();
  }, [conversationId, locale, normalizeProfileReport]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploadedFiles((prev) => [
        ...prev,
        {
          filename: data.filename,
          originalName: data.originalName,
          size: data.size,
          description: "",
        },
      ]);
    } catch {
      alert(t("uploadFailed"));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateFileDescription = (index: number, desc: string) => {
    setUploadedFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, description: desc } : f))
    );
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmitSupplement = async () => {
    const fileInfo = uploadedFiles
      .map((f) => `文件：${f.originalName}${f.description ? `（说明：${f.description}）` : ""}`)
      .join("\n");
    const supplementContext = [supplementText, fileInfo].filter(Boolean).join("\n\n");

    if (!supplementContext.trim()) return;

    setLoading(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          conversationId,
          message: locale === "zh"
            ? `我想补充一些信息：\n${supplementContext}`
            : `I'd like to add some information:\n${supplementContext}`,
          strategyCode: "AI-S01",
        }),
      });

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          strategyCode: "AI-S02",
          conversationId,
          supplement: supplementContext,
          context: `Please regenerate the user profile report based on the conversation and supplementary information`,
        }),
      });
      const data = await res.json();
      try {
        const jsonMatch = data.result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const normalized = normalizeProfileReport(parsed, data.result);
          setProfile(normalized);
          saveTopicDraft({ conversationId, profile: normalized });
        }
      } catch {
        // keep existing profile
      }
    } catch {
      // keep existing profile
    }
    setShowSupplement(false);
    setSupplementText("");
    setUploadedFiles([]);
    setLoading(false);
  };

  const nextUrl = conversationId
    ? `/${locale}/topic/keywords?conversationId=${conversationId}`
    : `/${locale}/topic/keywords`;

  const handleConfirmProfile = () => {
    if (profile) {
      saveTopicDraft({ step: "keywords", conversationId, profile });
    }
    router.push(nextUrl);
  };

  const profileCards = [
    {
      icon: "🧭",
      title: t("sectionInterests"),
      impact: t("impactInterests"),
      color: "purple",
      items: profile?.interests ?? [],
    },
    {
      icon: "🧰",
      title: t("sectionSkills"),
      impact: t("impactSkills"),
      color: "cyan",
      items: profile?.skills ?? [],
    },
    {
      icon: "⏱️",
      title: t("sectionTime"),
      impact: t("impactTime"),
      color: "amber",
      text: profile?.timeCommitment,
    },
    {
      icon: "🎯",
      title: t("sectionPreference"),
      impact: t("impactPreference"),
      color: "green",
      text: profile?.preferences,
    },
  ];

  const colorClasses: Record<string, { card: string; icon: string; pill: string; accent: string }> = {
    purple: {
      card: "border-purple/20 bg-purple/5",
      icon: "bg-purple/12 text-purple",
      pill: "bg-purple/10 text-purple",
      accent: "text-purple",
    },
    cyan: {
      card: "border-cyan/20 bg-cyan/5",
      icon: "bg-cyan/12 text-cyan",
      pill: "bg-cyan/10 text-cyan",
      accent: "text-cyan",
    },
    amber: {
      card: "border-amber/20 bg-amber/8",
      icon: "bg-amber/12 text-amber",
      pill: "bg-white/80 text-text",
      accent: "text-amber",
    },
    green: {
      card: "border-green/20 bg-green/5",
      icon: "bg-green/12 text-green",
      pill: "bg-white/80 text-text",
      accent: "text-green",
    },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-text-dim">{t("generating")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.push(`/${locale}/topic/chat`)}
        className="text-text-dim hover:text-accent text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("back")}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center text-lg">📋</div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 text-accent text-xs font-semibold mb-2">
            {t("step", { current: 2, total: 4 })}
          </div>
          <h1 className="text-2xl font-bold text-text">{t("title")}</h1>
          <p className="text-sm text-text-dim">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {isQuickStart && !conversationId && (
        <div className="mb-6 bg-amber/8 border border-amber/20 rounded-2xl p-4">
          <p className="text-sm text-text-dim">
            {t("defaultNotice")}
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-accent/8 via-white to-purple/8 border border-accent/15 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-lg">✨</span>
            <h3 className="text-sm font-bold text-accent">{t("sectionOverall")}</h3>
          </div>
          <p className="text-text leading-relaxed text-base">{profile?.profile}</p>
        </div>

        <div className="grid gap-4">
          {profileCards.map((card) => {
            const classes = colorClasses[card.color];
            return (
              <section key={card.title} className={`rounded-2xl border p-5 ${classes.card}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${classes.icon}`}>
                    {card.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-bold text-text">{card.title}</h3>
                      <span className={`text-xs font-semibold ${classes.accent}`}>{t("usedForRecommendation")}</span>
                    </div>

                    {card.items ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {card.items.map((item, i) => (
                          <span key={i} className={`rounded-full px-3 py-1 text-sm font-medium ${classes.pill}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm font-medium leading-relaxed text-text">{card.text}</p>
                    )}

                    <div className="mt-4 rounded-xl bg-white/72 border border-white/80 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted mb-1">
                        {t("recommendationImpact")}
                      </p>
                      <p className="text-sm leading-relaxed text-text-dim">{card.impact}</p>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="rounded-2xl border border-dashed border-accent/30 bg-accent/5 p-5">
          <h3 className="text-sm font-bold text-text mb-3">{t("nextRecommendationTitle")}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/80 p-3">
              <p className="text-xs font-semibold text-accent mb-1">{t("recommendStep1Title")}</p>
              <p className="text-xs leading-relaxed text-text-dim">{t("recommendStep1Desc")}</p>
            </div>
            <div className="rounded-xl bg-white/80 p-3">
              <p className="text-xs font-semibold text-purple mb-1">{t("recommendStep2Title")}</p>
              <p className="text-xs leading-relaxed text-text-dim">{t("recommendStep2Desc")}</p>
            </div>
            <div className="rounded-xl bg-white/80 p-3">
              <p className="text-xs font-semibold text-green mb-1">{t("recommendStep3Title")}</p>
              <p className="text-xs leading-relaxed text-text-dim">{t("recommendStep3Desc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supplement section */}
      {showSupplement && (
        <div className="mt-6 bg-white rounded-2xl border-2 border-accent/30 p-6 space-y-5">
          <div>
            <h3 className="font-bold text-text">{t("supplementTitle")}</h3>
            <p className="text-xs text-text-dim mt-1">
              {t("supplementDesc")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-dim mb-2">
              {t("textLabel")}
            </label>
            <textarea
              value={supplementText}
              onChange={(e) => setSupplementText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors resize-y"
              placeholder={t("textPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-dim mb-2">
              {t("uploadLabel")}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-3 w-full px-4 py-4 border-2 border-dashed border-border rounded-xl text-text-dim hover:border-accent hover:text-accent transition-colors"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                  <span className="text-sm">{t("uploading")}</span>
                </>
              ) : (
                <>
                  <span className="text-xl">📎</span>
                  <span className="text-sm">{t("uploadHint")}</span>
                </>
              )}
            </button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="bg-surface2 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {file.originalName.endsWith(".pdf") ? "📄" : "📁"}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-text">{file.originalName}</p>
                        <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-text-muted hover:text-rose text-sm transition-colors"
                    >
                      {t("deleteFile")}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={file.description}
                    onChange={(e) => updateFileDescription(i, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                    placeholder={t("fileDescPlaceholder")}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmitSupplement}
              disabled={!supplementText.trim() && uploadedFiles.length === 0}
              className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors text-sm"
            >
              {t("submitSupplement")}
            </button>
            <button
              onClick={() => {
                setShowSupplement(false);
                setSupplementText("");
                setUploadedFiles([]);
              }}
              className="px-4 py-2.5 border border-border hover:border-accent hover:text-accent text-text-dim rounded-xl transition-colors text-sm"
            >
              {tCommon("cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-8">
        <button
          onClick={handleConfirmProfile}
          className="flex-1 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
        >
          {t("confirm")}
        </button>
        {!showSupplement && (
          <button
            onClick={() => setShowSupplement(true)}
            className="px-6 py-3.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
          >
            {t("addInfo")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function TopicProfilePage() {
  const tCommon = useTranslations("common");
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">{tCommon("loading")}</div></div>}>
      <ProfileContent />
    </Suspense>
  );
}
