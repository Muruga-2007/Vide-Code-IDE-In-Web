"use client";

import { useState } from "react";
import { CheckCircle2, Trash2, Zap, ChevronDown, ChevronRight } from "lucide-react";
import type { FileManifest, FileEntry } from "@/types/pipeline";

interface Props {
  manifest: FileManifest;
  onExecute: (manifest: FileManifest) => void;
  onDiscard: () => void;
  isExecuting: boolean;
}

const COMPLEXITY_COLORS: Record<string, string> = {
  high:   "bg-red-900/40 text-red-300 border-red-800/40",
  medium: "bg-amber-900/40 text-amber-300 border-amber-800/40",
  low:    "bg-emerald-900/40 text-emerald-300 border-emerald-800/40",
};

const TYPE_ICONS: Record<string, string> = {
  config: "⚙️", schema: "📐", model: "🗃️", core: "⚡",
  util: "🔧", test: "🧪", docs: "📄",
};

export function PlanReviewPanel({ manifest: initialManifest, onExecute, onDiscard, isExecuting }: Props) {
  const [manifest, setManifest] = useState<FileManifest>(initialManifest);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  };

  const removeFile = (path: string) => {
    setManifest((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.path !== path),
    }));
  };

  const updateComplexity = (path: string, complexity: FileEntry["complexity"]) => {
    setManifest((prev) => ({
      ...prev,
      files: prev.files.map((f) => f.path === path ? { ...f, complexity } : f),
    }));
  };

  const grouped: Record<string, FileEntry[]> = {};
  manifest.files.forEach((f) => {
    if (!grouped[f.type]) grouped[f.type] = [];
    grouped[f.type].push(f);
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-900">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">AI Plan Review</h2>
            <p className="text-[10px] text-zinc-500">
              Review and edit before generating — {manifest.files.length} files
            </p>
          </div>
        </div>
      </div>

      {/* Project info */}
      <div className="shrink-0 px-4 py-3 border-b border-zinc-800 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-300">{manifest.project_name}</span>
        </div>
        {manifest.description && (
          <p className="text-[11px] text-zinc-500 leading-relaxed">{manifest.description}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {manifest.tech_stack.map((tech) => (
            <span key={tech} className="text-[10px] bg-blue-900/40 text-blue-300 border border-blue-800/40 px-1.5 py-0.5 rounded">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {Object.entries(grouped).map(([type, files]) => (
          <div key={type} className="space-y-0.5">
            <div className="flex items-center gap-1.5 py-1 text-[10px] text-zinc-500 uppercase tracking-widest">
              <span>{TYPE_ICONS[type] ?? "📄"}</span>
              <span>{type}</span>
              <span className="text-zinc-700">({files.length})</span>
            </div>
            {files.map((file) => (
              <div key={file.path} className="group rounded border border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <button
                    onClick={() => toggleExpand(file.path)}
                    className="text-zinc-600 hover:text-zinc-400 shrink-0"
                  >
                    {expanded.has(file.path) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>

                  <span className="flex-1 text-[11px] text-zinc-300 font-mono truncate" title={file.path}>
                    {file.path}
                  </span>

                  {/* Complexity selector */}
                  <select
                    value={file.complexity}
                    onChange={(e) => updateComplexity(file.path, e.target.value as FileEntry["complexity"])}
                    className={`text-[9px] border rounded px-1 py-0.5 bg-transparent cursor-pointer focus:outline-none ${COMPLEXITY_COLORS[file.complexity]}`}
                  >
                    <option value="high">high</option>
                    <option value="medium">medium</option>
                    <option value="low">low</option>
                  </select>

                  {/* Remove file */}
                  <button
                    onClick={() => removeFile(file.path)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-600 hover:text-red-400 transition-all"
                    title="Remove from plan"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

                {expanded.has(file.path) && (
                  <div className="px-4 pb-2">
                    <p className="text-[10px] text-zinc-500 leading-relaxed">{file.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="shrink-0 px-4 py-3 border-t border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-2">
          <span>{manifest.files.length} files planned</span>
          <span>Edit complexity or remove files, then generate</span>
        </div>
        <button
          onClick={() => onExecute(manifest)}
          disabled={isExecuting || manifest.files.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white transition-colors"
        >
          {isExecuting ? (
            <>
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap size={12} />
              Generate Project ({manifest.files.length} files)
            </>
          )}
        </button>
        <button
          onClick={onDiscard}
          disabled={isExecuting}
          className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-1 transition-colors"
        >
          Discard Plan
        </button>
      </div>
    </div>
  );
}
