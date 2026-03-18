"use client";

import { CheckCircle2, XCircle, Circle } from "lucide-react";
import type { FileManifest, FileModelAssignment } from "@/types/pipeline";

interface Props {
  manifest: FileManifest;
  generatedPaths: Set<string>;
  errorPaths: Set<string>;
  activeFilePath?: string | null;
  modelAssignments?: Record<string, FileModelAssignment>;
}

const COMPLEXITY_BADGE: Record<string, string> = {
  high:   "bg-red-900/40 text-red-300 border border-red-800/50",
  medium: "bg-amber-900/40 text-amber-300 border border-amber-800/50",
  low:    "bg-emerald-900/40 text-emerald-300 border border-emerald-800/50",
};

const MODEL_COLORS: Record<string, string> = {
  "gemini-2.5-flash": "text-blue-400",
  "gemini-2.5-pro":   "text-violet-400",
  "gemini-2.0-flash": "text-emerald-400",
};

export function FileManifestView({
  manifest,
  generatedPaths,
  errorPaths,
  activeFilePath,
  modelAssignments = {},
}: Props) {
  const total = manifest.files.length;
  const done  = manifest.files.filter((f) => generatedPaths.has(f.path)).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-zinc-300">Project Manifest</span>
        <span className="text-[10px] bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
          {manifest.project_name}
        </span>
        {total > 0 && (
          <span className="text-[10px] text-zinc-500 ml-auto">
            {done}/{total}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Description */}
      {manifest.description && (
        <p className="text-[11px] text-zinc-500 leading-relaxed">{manifest.description}</p>
      )}

      {/* Tech stack badges */}
      {manifest.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {manifest.tech_stack.map((tech) => (
            <span key={tech} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* File list */}
      <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5 pr-1">
        {manifest.files.map((file) => {
          const isGenerated = generatedPaths.has(file.path);
          const hasError    = errorPaths.has(file.path);
          const isActive    = file.path === activeFilePath && !isGenerated && !hasError;
          const assignment  = modelAssignments[file.path];

          return (
            <div
              key={file.path}
              className={`flex items-center gap-2 py-1 rounded px-1 transition-colors ${
                isActive ? "bg-blue-900/20 border border-blue-800/30" : "hover:bg-zinc-800/40"
              }`}
            >
              {/* Status icon */}
              <span className="shrink-0">
                {hasError ? (
                  <XCircle size={12} className="text-red-400" />
                ) : isGenerated ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : isActive ? (
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Circle size={12} className="text-zinc-600" />
                )}
              </span>

              {/* Path */}
              <span
                className={
                  "text-[11px] truncate flex-1 font-mono " +
                  (hasError ? "text-red-400" : isGenerated ? "text-zinc-300" : "text-zinc-500")
                }
                title={file.path}
              >
                {file.path}
              </span>

              {/* Model assignment (Phase 3 — appears after file is generated) */}
              {assignment && (
                <span
                  className={`text-[9px] font-mono shrink-0 ${MODEL_COLORS[assignment.model] ?? "text-zinc-500"}`}
                  title={assignment.model}
                >
                  {assignment.model.replace("gemini-", "g-")}
                </span>
              )}

              {/* Complexity heatmap badge (Phase 3) */}
              <span
                className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${COMPLEXITY_BADGE[file.complexity] ?? "bg-zinc-800 text-zinc-500"}`}
              >
                {file.complexity}
              </span>

              {/* Type badge */}
              <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1 py-0.5 rounded shrink-0">
                {file.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
