"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import ChatWindow from "@/components/ChatWindow";
import RotoAvatar from "@/components/RotoAvatar";

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  explanation: string | null;
  status: string;
  phase: { name: string; project: { id: string; topic: { name: string } | null } };
}

interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  path: string;
}

function TaskContent() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const taskId = params.taskId as string;
  const projectId = searchParams.get("projectId");
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [content, setContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("task");
  const tCommon = useTranslations("common");

  useEffect(() => {
    async function fetchTask() {
      const res = await fetch("/api/projects");
      const projects = await res.json();
      for (const p of projects) {
        for (const phase of p.phases) {
          const found = phase.tasks.find((t: { id: string }) => t.id === taskId);
          if (found) {
            setTask({
              ...found,
              phase: { name: phase.name, project: { id: p.id, topic: p.topic } },
            });
            break;
          }
        }
      }
      setLoading(false);
    }
    fetchTask();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) return <div className="text-center py-20 text-text-dim">{t("notFound")}</div>;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error("Upload failed");
          return res.json() as Promise<UploadedFile>;
        })
      );
      setUploadedFiles((prev) => [...prev, ...uploaded]);
    } catch {
      alert(t("uploadFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const buildSubmissionContent = () => {
    const fileInfo = uploadedFiles
      .map((file, index) => `${index + 1}. ${file.originalName} (${formatFileSize(file.size)}) - ${file.path}`)
      .join("\n");
    return [
      content.trim(),
      fileInfo ? `${t("attachedFilesTitle")}\n${fileInfo}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const handleSubmit = async () => {
    const submissionContent = buildSubmissionContent();
    if (!submissionContent.trim()) return;
    sessionStorage.setItem(
      `task-submission-${taskId}`,
      JSON.stringify({ content: submissionContent, files: uploadedFiles })
    );
    router.push(
      `/${locale}/task/${taskId}/submit?projectId=${projectId}`
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-text-dim hover:text-accent text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("back")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <span className="text-xs text-text-muted bg-surface2 px-2.5 py-1 rounded-full">{task.phase.name}</span>
            <h1 className="text-2xl font-bold mt-2 text-text">{task.title}</h1>
            {task.description && (
              <p className="text-text-dim mt-2 leading-relaxed">{task.description}</p>
            )}
          </div>

          {/* Task explanation link */}
          <button
            onClick={() => router.push(`/${locale}/task/${taskId}/explain?projectId=${projectId}`)}
            className="w-full mb-6 bg-white rounded-2xl border border-border p-4 text-left hover:border-accent hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-lg">📖</div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-text">{t("explainBtn")}</p>
                <p className="text-xs text-text-dim">{t("explainHint")}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted group-hover:text-accent transition-colors">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>

          {/* Submission area */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-bold mb-4 text-text">{t("submitTitle")}</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text placeholder-text-muted font-mono resize-y focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
              placeholder={t("submitPlaceholder")}
            />

            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-4 text-left transition-all hover:border-accent hover:bg-accent/10 disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm">📎</div>
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {uploading ? t("uploading") : t("uploadTitle")}
                    </p>
                    <p className="text-xs text-text-dim">{t("uploadHint")}</p>
                  </div>
                </div>
              </button>

              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={`${file.filename}-${index}`} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                      <span className="text-sm">📄</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">{file.originalName}</p>
                        <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-xs font-medium text-text-muted hover:text-rose"
                      >
                        {t("removeFile")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!content.trim() && uploadedFiles.length === 0}
              className="mt-4 px-8 py-3 bg-green hover:bg-green/90 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-green/20"
            >
              {t("submitBtn")}
            </button>
          </div>
        </div>

        {/* AI Tutor sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-border p-4 sticky top-24">
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full flex items-center gap-3 mb-4"
            >
              <RotoAvatar size="xxs" />
              <div className="text-left flex-1">
                <p className="font-semibold text-sm text-text">{tCommon("rotaMentor")}</p>
                <p className="text-xs text-text-dim">{t("chatTitle")}</p>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                className={`text-text-muted transition-transform ${showChat ? "rotate-90" : ""}`}
              >
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showChat && (
              <div className="h-80 border-t border-border pt-4">
                <ChatWindow
                  strategyCode="AI-S13"
                  projectId={task.phase.project.id}
                  context={`当前任务：${task.title}\n任务描述：${task.description || ""}\n课题：${task.phase.project.topic?.name || ""}`}
                  placeholder={t("placeholder")}
                  initialMessages={[
                    {
                      role: "assistant",
                      content: t("initialMsg", { taskTitle: task.title }),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <TaskContent />
    </Suspense>
  );
}
