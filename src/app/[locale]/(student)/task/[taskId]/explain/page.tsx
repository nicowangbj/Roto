"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

type NoteBlock =
  | { type: "heading1" | "heading2" | "heading3" | "paragraph" | "quote"; text: string }
  | { type: "numbered"; text: string; number: string }
  | { type: "bullet"; text: string }
  | { type: "divider" };

const NOTE_THEMES = [
  { accent: "#47a8ff", soft: "#eef7ff", icon: "🔎" },
  { accent: "#f2ba19", soft: "#fff7dc", icon: "💡" },
  { accent: "#51c38b", soft: "#e9fff3", icon: "🧪" },
  { accent: "#ff6b81", soft: "#ffe8ec", icon: "📝" },
];

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/, "")
    .trim();
}

function parseExplanation(markdown: string): NoteBlock[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (/^---+$/.test(line)) return { type: "divider" };
      if (line.startsWith("# ")) return { type: "heading1", text: stripMarkdown(line) };
      if (line.startsWith("## ")) return { type: "heading2", text: stripMarkdown(line) };
      if (line.startsWith("### ")) return { type: "heading3", text: stripMarkdown(line) };
      if (line.startsWith(">")) return { type: "quote", text: stripMarkdown(line.replace(/^>\s*/, "")) };

      const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
      if (numbered) {
        return { type: "numbered", number: numbered[1], text: stripMarkdown(numbered[2]) };
      }

      const bullet = line.match(/^[-*]\s+(.+)$/);
      if (bullet) return { type: "bullet", text: stripMarkdown(bullet[1]) };

      return { type: "paragraph", text: stripMarkdown(line) };
    });
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index} className="font-bold text-text">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function StudyNote({ content }: { content: string }) {
  const blocks = parseExplanation(content);
  const sectionIndexes = blocks.reduce<number[]>((indexes, block, index) => {
    const previous = index === 0 ? -1 : indexes[index - 1];
    indexes.push(block.type === "heading2" ? previous + 1 : previous);
    return indexes;
  }, []);

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        const sectionIndex = sectionIndexes[index];
        if (block.type === "divider") {
          return (
            <div key={index} className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="text-xs font-semibold text-text-muted bg-surface2 px-3 py-1 rounded-full">note break</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          );
        }

        if (block.type === "heading1") {
          return (
            <div key={index} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-sky-soft via-white to-brand-cloud border border-border p-6">
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-brand-sun/25" />
              <div className="absolute right-12 bottom-3 w-20 h-20 rounded-full bg-brand-sky/10" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-sky-deep mb-2">Research Guide</p>
              <h2 className="relative text-2xl font-black text-text leading-tight">{block.text}</h2>
            </div>
          );
        }

        if (block.type === "heading2") {
          const theme = NOTE_THEMES[sectionIndex % NOTE_THEMES.length];
          return (
            <div key={index} className="pt-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow-sm"
                  style={{ background: theme.soft, color: theme.accent }}
                >
                  {theme.icon}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Section {sectionIndex + 1}</p>
                  <h3 className="text-xl font-black text-text">{block.text}</h3>
                </div>
              </div>
            </div>
          );
        }

        if (block.type === "heading3") {
          const theme = NOTE_THEMES[Math.max(sectionIndex, 0) % NOTE_THEMES.length];
          return (
            <div key={index} className="flex items-center gap-2 pt-2">
              <span className="w-2 h-2 rounded-full" style={{ background: theme.accent }} />
              <h4 className="text-base font-bold text-text">{block.text}</h4>
            </div>
          );
        }

        if (block.type === "quote") {
          return (
            <div key={index} className="relative rounded-2xl border border-brand-sky/20 bg-brand-sky-soft/70 p-4 pl-5 shadow-sm">
              <div className="absolute left-0 top-4 h-8 w-1 rounded-r-full bg-brand-sky" />
              <p className="text-sm font-medium leading-relaxed text-text-dim">
                <span className="mr-2">💡</span>
                <RichText text={block.text} />
              </p>
            </div>
          );
        }

        if (block.type === "numbered") {
          const theme = NOTE_THEMES[Math.max(sectionIndex, 0) % NOTE_THEMES.length];
          return (
            <div key={index} className="flex gap-4 rounded-2xl bg-white border border-border p-4 shadow-sm">
              <div
                className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-black text-white"
                style={{ background: theme.accent }}
              >
                {block.number}
              </div>
              <p className="text-sm leading-relaxed text-text-dim pt-1">
                <RichText text={block.text} />
              </p>
            </div>
          );
        }

        if (block.type === "bullet") {
          const theme = NOTE_THEMES[Math.max(sectionIndex, 0) % NOTE_THEMES.length];
          return (
            <div key={index} className="flex gap-3 rounded-2xl p-4" style={{ background: theme.soft }}>
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: theme.accent }} />
              <p className="text-sm leading-relaxed text-text-dim">
                <RichText text={block.text} />
              </p>
            </div>
          );
        }

        return (
          <p key={index} className="text-[15px] leading-8 text-text-dim">
            <RichText text={block.text} />
          </p>
        );
      })}
    </div>
  );
}

export default function TaskExplainPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [taskTitle, setTaskTitle] = useState("");
  const t = useTranslations("taskExplain");
  const locale = useLocale();

  useEffect(() => {
    async function fetchExplanation() {
      const res = await fetch("/api/projects");
      const projects = await res.json();
      let task = null;
      for (const p of projects) {
        for (const phase of p.phases) {
          const found = phase.tasks.find((t: { id: string }) => t.id === taskId);
          if (found) {
            task = { ...found, phaseName: phase.name, topicName: p.topic?.name || p.title };
            break;
          }
        }
      }

      if (!task) {
        setExplanation(t("notFound"));
        setLoading(false);
        return;
      }

      setTaskTitle(task.title);

      if (task.explanation) {
        setExplanation(task.explanation);
        setLoading(false);
        return;
      }

      try {
        const genRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-locale": locale },
          body: JSON.stringify({
            strategyCode: "AI-S12",
            input: `Task: ${task.title}\nDescription: ${task.description || "N/A"}\nPhase: ${task.phaseName}\nTopic: ${task.topicName}`,
          }),
        });
        const data = await genRes.json();
        setExplanation(data.result);
      } catch {
        setExplanation(
          `# ${task.title}\n\n## Task Overview\n${task.description || "Complete the tasks required for this phase."}\n\n## Steps\n1. Read the task requirements carefully\n2. Research relevant materials\n3. Complete the work\n4. Review and submit\n\n> 💡 Full AI explanations require a GEMINI_API_KEY to be configured.`
        );
      }
      setLoading(false);
    }
    fetchExplanation();
  }, [taskId, t, locale]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin mb-4" />
        <p className="text-text-dim">{t("generating")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-text-dim hover:text-accent text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("back")}
      </button>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-white/90 p-6 mb-8 shadow-lg shadow-slate-900/5">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-br from-brand-cloud/70 to-brand-sky-soft/70" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan/30 to-brand-sun/40 flex items-center justify-center text-2xl shadow-sm">📖</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-sky-deep">Study Notes</p>
            <h1 className="text-3xl font-black text-text mt-1">{t("title")}</h1>
            <p className="text-text-dim text-sm mt-1">{taskTitle}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
        <div className="bg-white rounded-3xl border border-border p-7 shadow-lg shadow-slate-900/5">
          <StudyNote content={explanation} />
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted mb-4">Learning Map</p>
            {[
              ["Understand", "Clarify what the task is asking."],
              ["Plan", "Break it into concrete actions."],
              ["Check", "Compare your output with the goal."],
            ].map(([title, desc], index) => {
              const theme = NOTE_THEMES[index % NOTE_THEMES.length];
              return (
                <div key={title} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white"
                      style={{ background: theme.accent }}
                    >
                      {index + 1}
                    </div>
                    {index < 2 && <div className="w-px flex-1 bg-border mt-2" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text">{title}</p>
                    <p className="text-xs leading-relaxed text-text-muted mt-0.5">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-brand-sun/30 bg-brand-cloud/50 p-5">
            <p className="text-sm font-bold text-text mb-2">Note-taking tip</p>
            <p className="text-xs leading-relaxed text-text-dim">
              Read the colored cards first, then use the numbered steps as your action checklist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
