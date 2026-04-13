"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  description: string;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const isQuickStart = searchParams.get("quickStart") === "1";
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{
    profile: string;
    interests: string[];
    skills: string[];
    timeCommitment: string;
    preferences: string;
  } | null>({
    profile: "这是一位对科技和社会议题都充满好奇心的高中生。具备基础的信息搜索和数据整理能力，善于观察身边现象并提出问题。适合从社会调查类或实验观察类的入门课题开始科研之旅。",
    interests: ["人工智能", "心理学", "环境科学", "社交媒体"],
    skills: ["信息检索", "数据整理", "PPT制作", "基础统计"],
    timeCommitment: "每周5小时",
    preferences: "偏好实证研究，希望课题贴近生活",
  });

  const [showSupplement, setShowSupplement] = useState(false);
  const [supplementText, setSupplementText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    async function generateProfile() {
      setLoading(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategyCode: "AI-S02",
            input: `对话ID: ${conversationId}`,
            context: `请基于对话内容生成用户画像报告`,
          }),
        });
        const data = await res.json();
        const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setProfile({
            profile: parsed.profile || data.result,
            interests: Array.isArray(parsed.interests) ? parsed.interests : [],
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            timeCommitment: parsed.timeCommitment || "待确认",
            preferences: parsed.preferences || "待确认",
          });
        }
      } catch {
        // keep default profile
      }
      setLoading(false);
    }
    generateProfile();
  }, [conversationId]);

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
      alert("文件上传失败，请重试");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: `我想补充一些信息：\n${supplementContext}`,
          strategyCode: "AI-S01",
        }),
      });

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyCode: "AI-S02",
          input: `对话ID: ${conversationId}\n\n补充信息：\n${supplementContext}`,
          context: `请基于对话内容和补充信息重新生成用户画像报告`,
        }),
      });
      const data = await res.json();
      try {
        const jsonMatch = data.result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setProfile({
            profile: parsed.profile || data.result,
            interests: Array.isArray(parsed.interests) ? parsed.interests : [],
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            timeCommitment: parsed.timeCommitment || "待确认",
            preferences: parsed.preferences || "待确认",
          });
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
    ? `/topic/keywords?conversationId=${conversationId}`
    : "/topic/keywords";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-text-dim">AI 导师正在为你生成画像报告...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.push("/topic/chat")}
        className="text-text-dim hover:text-accent text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        返回上一步
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center text-lg">📋</div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 text-accent text-xs font-semibold mb-2">
            第 2 步 / 4 · 确认你的画像
          </div>
          <h1 className="text-2xl font-bold text-text">你的画像报告</h1>
          <p className="text-sm text-text-dim">
            这是 AI 导师基于你们的对话生成的报告，请确认是否准确
          </p>
        </div>
      </div>

      {isQuickStart && !conversationId && (
        <div className="mb-6 bg-amber/8 border border-amber/20 rounded-2xl p-4">
          <p className="text-sm text-text-dim">
            你现在看到的是一份默认画像草案，用来帮助你快速体验后续选题流程。如果有不准确的地方，可以先补充信息，再继续。
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-accent mb-2">总体描述</h3>
          <p className="text-text-dim leading-relaxed">{profile?.profile}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-accent mb-3">兴趣方向</h3>
          <div className="flex flex-wrap gap-2">
            {(profile?.interests || []).map((interest, i) => (
              <span key={i} className="px-3 py-1 bg-purple/10 text-purple text-sm font-medium rounded-full">
                {interest}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-accent mb-3">已有技能</h3>
          <div className="flex flex-wrap gap-2">
            {(profile?.skills || []).map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-cyan/10 text-cyan text-sm font-medium rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-surface2 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted mb-1">时间安排</h3>
            <p className="text-text font-medium">{profile?.timeCommitment}</p>
          </div>
          <div className="bg-surface2 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-muted mb-1">研究偏好</h3>
            <p className="text-text font-medium">{profile?.preferences}</p>
          </div>
        </div>
      </div>

      {/* Supplement section */}
      {showSupplement && (
        <div className="mt-6 bg-white rounded-2xl border-2 border-accent/30 p-6 space-y-5">
          <div>
            <h3 className="font-bold text-text">补充信息</h3>
            <p className="text-xs text-text-dim mt-1">
              你可以上传 PDF 文件并添加文字说明，帮助导师更全面地了解你
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-dim mb-2">
              文字补充
            </label>
            <textarea
              value={supplementText}
              onChange={(e) => setSupplementText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors resize-y"
              placeholder="补充你想让导师知道的信息，比如已有的研究经验、特别感兴趣的方向、目前的学习情况等..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-dim mb-2">
              上传文件
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
                  <span className="text-sm">上传中...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">📎</span>
                  <span className="text-sm">点击上传 PDF、Word、图片等文件</span>
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
                      删除
                    </button>
                  </div>
                  <input
                    type="text"
                    value={file.description}
                    onChange={(e) => updateFileDescription(i, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                    placeholder="为这个文件添加说明，比如：这是我之前写的一篇小论文..."
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
              提交补充信息，重新生成画像
            </button>
            <button
              onClick={() => {
                setShowSupplement(false);
                setSupplementText("");
                setUploadedFiles([]);
              }}
              className="px-4 py-2.5 border border-border hover:border-accent hover:text-accent text-text-dim rounded-xl transition-colors text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => router.push(nextUrl)}
          className="flex-1 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
        >
          确认，继续选题
        </button>
        {!showSupplement && (
          <button
            onClick={() => setShowSupplement(true)}
            className="px-6 py-3.5 border border-border hover:border-accent hover:text-accent text-text-dim font-semibold rounded-xl transition-colors"
          >
            补充信息
          </button>
        )}
      </div>
    </div>
  );
}

export default function TopicProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-text-dim">加载中...</div></div>}>
      <ProfileContent />
    </Suspense>
  );
}
