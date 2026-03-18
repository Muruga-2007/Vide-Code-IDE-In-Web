"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Zap, RotateCcw, X, Image as ImageIcon, Clock, ChevronDown } from "lucide-react";
import type { StartPipelineOptions } from "@/hooks/usePipelineStream";
import type { ProjectType, GenerationMode, ChatMessage } from "@/types/pipeline";

interface Props {
  onGenerate: (
    prompt: string,
    language: string,
    options: StartPipelineOptions
  ) => void;
  isGenerating: boolean;
  onReset: () => void;
  hasResult: boolean;
  chatHistory?: ChatMessage[];
  onAddChatMessage?: (msg: Omit<ChatMessage, "id">) => void;
}

type Mode = "single" | "multi";

const LANGUAGES = [
  { value: "python",     label: "Python"     },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "go",         label: "Go"         },
  { value: "rust",       label: "Rust"       },
  { value: "java",       label: "Java"       },
  { value: "bash",       label: "Bash"       },
];

const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "frontend",   label: "Frontend"  },
  { value: "backend",    label: "Backend"   },
  { value: "fullstack",  label: "Full Stack"},
  { value: "micro_saas", label: "Micro SaaS"},
];

interface ImagePreview {
  mime_type: string;
  data: string;
  preview: string;
}

export function AIGeneratePanel({
  onGenerate,
  isGenerating,
  onReset,
  hasResult,
  chatHistory = [],
  onAddChatMessage,
}: Props) {
  const [mode, setMode] = useState<Mode>("single");
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("python");
  const [projectType, setProjectType] = useState<ProjectType>("backend");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [planMode, setPlanMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const labelClass = "block text-xs text-zinc-400 mb-1";
  const inputClass =
    "w-full bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors";
  const selectClass = inputClass + " cursor-pointer";

  // Scroll history to bottom when new messages arrive
  useEffect(() => {
    if (historyOpen && historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [chatHistory, historyOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.slice(0, 3 - images.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        const [header, data] = result.split(",");
        const mime_type = header.replace("data:", "").replace(";base64", "");
        setImages((prev) =>
          prev.length < 3 ? [...prev, { mime_type, data, preview: result }] : prev
        );
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;

    onAddChatMessage?.({
      prompt: prompt.trim(),
      mode: mode === "single" ? "single_file" : "multi_file",
      timestamp: Date.now(),
      language: mode === "single" ? language : undefined,
    });

    if (mode === "single") {
      onGenerate(prompt, language, { mode: "single_file" });
    } else {
      onGenerate(prompt, "python", {
        mode: "multi_file",
        projectType,
        images: images.map(({ mime_type, data }) => ({ mime_type, data })),
        planOnly: planMode,
      });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat history toggle */}
      {chatHistory.length > 0 && (
        <div className="shrink-0 border-b border-zinc-800">
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Clock size={11} />
              <span>History ({chatHistory.length})</span>
            </div>
            <ChevronDown
              size={11}
              className={`transition-transform ${historyOpen ? "rotate-180" : ""}`}
            />
          </button>

          {historyOpen && (
            <div
              ref={historyRef}
              className="max-h-40 overflow-y-auto px-3 pb-2 space-y-1.5 bg-zinc-950/50"
            >
              {chatHistory.map((msg) => (
                <div key={msg.id} className="rounded bg-zinc-800/60 px-2.5 py-1.5 space-y-0.5">
                  <p className="text-[11px] text-zinc-300 line-clamp-2">{msg.prompt}</p>
                  <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                    <span>{msg.mode === "multi_file" ? "Multi-File" : `Single • ${msg.language}`}</span>
                    <span>·</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    {msg.fileCount && <><span>·</span><span>{msg.fileCount} files</span></>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-zinc-800 rounded-md">
          {(["single", "multi"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={isGenerating}
              className={
                "flex-1 text-xs py-1 rounded transition-colors " +
                (mode === m
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300")
              }
            >
              {m === "single" ? "Single File" : "Multi-File Project"}
            </button>
          ))}
        </div>

        {mode === "single" && (
          <>
            <div>
              <label className={labelClass}>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isGenerating}
                className={selectClass}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Prompt</label>
              <textarea
                rows={6}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder="Describe what you want to build..."
                className={inputClass + " resize-none"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
                }}
              />
            </div>
          </>
        )}

        {mode === "multi" && (
          <>
            <div>
              <label className={labelClass}>Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                disabled={isGenerating}
                className={selectClass}
              >
                {PROJECT_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Project Description</label>
              <textarea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder="e.g. 'A FastAPI REST API for a todo app with SQLite'"
                className={inputClass + " resize-none"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
                }}
              />
            </div>

            {/* Plan Mode toggle */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => !isGenerating && setPlanMode((p) => !p)}
                className={`relative w-8 h-4 rounded-full transition-colors ${
                  planMode ? "bg-violet-600" : "bg-zinc-700"
                } ${isGenerating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                    planMode ? "translate-x-4" : ""
                  }`}
                />
              </div>
              <div>
                <span className="text-xs text-zinc-300">Plan Mode</span>
                <p className="text-[10px] text-zinc-600">Review AI plan before generating files</p>
              </div>
            </label>

            {/* Image upload */}
            <div>
              <label className={labelClass}>Reference Images (optional, max 3)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.preview}
                      alt={`Reference ${idx + 1}`}
                      className="w-full h-full object-cover rounded border border-zinc-700"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 border border-zinc-600 rounded-full flex items-center justify-center hover:bg-red-900/50"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className="w-16 h-16 border border-dashed border-zinc-700 rounded flex flex-col items-center justify-center gap-1 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400 transition-colors"
                  >
                    <ImageIcon size={14} />
                    <span className="text-[9px]">Add</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isGenerating || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Generating...
            </>
          ) : mode === "multi" && planMode ? (
            <>
              <span className="text-sm">🧠</span>
              Plan Project
            </>
          ) : mode === "multi" ? (
            <>
              <Zap size={12} />
              Generate Project
            </>
          ) : (
            <>
              <Zap size={12} />
              Generate
            </>
          )}
        </button>

        {/* Reset button */}
        {hasResult && !isGenerating && (
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-600 rounded-md transition-colors"
          >
            <RotateCcw size={11} />
            Reset
          </button>
        )}

        <p className="text-[10px] text-zinc-600 text-center">Ctrl+Enter to submit</p>
      </div>
    </div>
  );
}
