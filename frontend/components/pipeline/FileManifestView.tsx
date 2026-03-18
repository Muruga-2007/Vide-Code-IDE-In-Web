"use client";

import { CheckCircle2, XCircle, Circle } from "lucide-react";
import type { FileManifest } from "@/types/pipeline";

interface Props {
  manifest: FileManifest;
  generatedPaths: Set<string>;
  errorPaths: Set<string>;
}

export function FileManifestView({ manifest, generatedPaths, errorPaths }: Props) {
  const lastGenerated = manifest.files
    .filter((f) => generatedPaths.has(f.path))
    .pop();

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-zinc-300">
          Project Manifest
        </span>
        <span className="text-[10px] bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
          {manifest.project_name}
        </span>
      </div>

      {/* Description */}
      {manifest.description && (
        <p className="text-[11px] text-zinc-500 leading-relaxed">{manifest.description}</p>
      )}

      {/* Tech stack badges */}
      {manifest.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {manifest.tech_stack.map((tech) => (
            <span
              key={tech}
              className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* File list */}
      <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5 pr-1">
        {manifest.files.map((file) => {
          const isGenerated = generatedPaths.has(file.path);
          const hasError = errorPaths.has(file.path);
          const isActive =
            !isGenerated && !hasError && lastGenerated === undefined
              ? false
              : file.path === (lastGenerated?.path ?? null) && isGenerated;

          return (
            <div
              key={file.path}
              className="flex items-center gap-2 py-0.5 rounded px-1 hover:bg-zinc-800/40"
            >
              {/* Status icon */}
              <span className="shrink-0">
                {hasError ? (
                  <XCircle size={12} className="text-red-400" />
                ) : isGenerated ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : (
                  <Circle size={12} className="text-zinc-600" />
                )}
              </span>

              {/* Active pulsing dot */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
              )}

              {/* Path */}
              <span
                className={
                  "text-[11px] truncate flex-1 " +
                  (hasError
                    ? "text-red-400"
                    : isGenerated
                    ? "text-zinc-300"
                    : "text-zinc-500")
                }
                title={file.path}
              >
                {file.path}
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
