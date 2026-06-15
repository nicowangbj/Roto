"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  source: string;
  weekNumber: number | null;
  createdAt: string;
}

export default function JournalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("journal");
  const locale = useLocale();

  const sourceConfig: Record<string, { label: string; color: string; bg: string }> = {
    task_complete: { label: t("sourceTask"), color: "text-green", bg: "bg-green/10" },
    phase_complete: { label: t("sourcePhase"), color: "text-cyan", bg: "bg-cyan/10" },
    plan_adjust: { label: t("sourcePlanAdjust"), color: "text-amber", bg: "bg-amber/10" },
    topic_confirm: { label: t("sourceTopic"), color: "text-purple", bg: "bg-purple/10" },
    project_complete: { label: t("sourceProject"), color: "text-rose", bg: "bg-rose/10" },
  };

  useEffect(() => {
    async function fetchJournal() {
      const url = projectId ? `/api/journal?projectId=${projectId}` : "/api/journal";
      const res = await fetch(url);
      if (!res.ok) {
        setEntries([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    fetchJournal();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-lg">📔</div>
        <div>
          <h1 className="text-2xl font-bold text-text">{t("title")}</h1>
          <p className="text-sm text-text-dim">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center text-3xl mx-auto mb-4">📔</div>
          <p className="text-text-dim mb-2">{t("empty")}</p>
          <p className="text-text-muted text-sm">
            {t("emptyHint")}
          </p>
        </div>
      ) : (
        <div className="relative pl-8">
          {/* Timeline vertical line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-accent via-cyan to-green" />

          <div className="space-y-4">
            {entries.map((entry) => {
              const source = sourceConfig[entry.source] || {
                label: entry.source,
                color: "text-text-muted",
                bg: "bg-surface2",
              };
              return (
                <div key={entry.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-8 top-6 w-4 h-4 rounded-full bg-accent border-4 border-bg z-10" />

                  <button
                    onClick={() =>
                      router.push(
                        `/${locale}/journal/${entry.id}${projectId ? `?projectId=${projectId}` : ""}`
                      )
                    }
                    className="w-full text-left bg-white rounded-2xl border border-border p-5 hover:border-accent hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${source.bg} ${source.color}`}>
                        {source.label}
                      </span>
                      {entry.weekNumber && (
                        <span className="text-xs text-text-muted">{t("week", { n: entry.weekNumber })}</span>
                      )}
                      <span className="text-xs text-text-muted ml-auto">
                        {new Date(entry.createdAt).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <h3 className="font-bold mb-1 text-text">{entry.title}</h3>
                    <p className="text-sm text-text-dim line-clamp-3 leading-relaxed">
                      {entry.content}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
