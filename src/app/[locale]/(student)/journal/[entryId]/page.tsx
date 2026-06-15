"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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

export default function JournalEntryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const entryId = params.entryId as string;
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("journalEntry");
  const locale = useLocale();

  useEffect(() => {
    async function fetchEntry() {
      const res = await fetch(projectId ? `/api/journal?projectId=${projectId}` : "/api/journal");
      if (!res.ok) {
        setEntry(null);
        setLoading(false);
        return;
      }
      const entries = await res.json();
      const found = Array.isArray(entries)
        ? entries.find((e: JournalEntry) => e.id === entryId)
        : null;
      setEntry(found || null);
      setLoading(false);
    }
    fetchEntry();
  }, [entryId, projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return <div className="text-center py-20 text-text-dim">{t("notFound")}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push(`/${locale}/journal${projectId ? `?projectId=${projectId}` : ""}`)}
        className="text-text-dim hover:text-accent text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("back")}
      </button>

      <div className="bg-white rounded-2xl border border-border p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-text-muted">
            {new Date(entry.createdAt).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {entry.weekNumber && (
            <span className="text-xs text-text-muted">{t("week", { n: entry.weekNumber })}</span>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-6 text-text">{entry.title}</h1>

        <div className="h-px bg-gradient-to-r from-accent/20 via-accent/40 to-accent/20 my-6" />

        <div className="text-text-dim leading-relaxed whitespace-pre-wrap">
          {entry.content}
        </div>
      </div>
    </div>
  );
}
