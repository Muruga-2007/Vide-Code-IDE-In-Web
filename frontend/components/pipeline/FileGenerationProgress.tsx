"use client";

import type { FileEntry } from "@/types/pipeline";

interface Props {
  files: FileEntry[];
  generatedPaths: Set<string>;
  errorPaths: Set<string>;
  activeFilePath: string | null;
}

export function FileGenerationProgress({
  files,
  generatedPaths,
  errorPaths,
  activeFilePath,
}: Props) {
  const total = files.length;
  const done = files.filter((f) => generatedPaths.has(f.path)).length;
  const errors = files.filter((f) => errorPaths.has(f.path)).length;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Header + count */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300">
          File Generation
        </span>
        <span className="text-xs text-zinc-500">
          {done} / {total} files
          {errors > 0 && (
            <span className="text-red-400 ml-1">({errors} errors)</span>
          )}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* File chips grid */}
      <div className="grid grid-cols-2 gap-1">
        {files.map((file) => {
          const isGenerated = generatedPaths.has(file.path);
          const hasError = errorPaths.has(file.path);
          const isActive = activeFilePath === file.path;
          const filename = file.path.split(/[\\/]/).pop() ?? file.path;

          let chipClass =
            "px-2 py-1 rounded text-[10px] truncate transition-colors ";
          if (hasError) {
            chipClass += "bg-red-900/30 text-red-400";
          } else if (isActive) {
            chipClass +=
              "bg-blue-900/40 text-blue-300 border border-blue-500/50 animate-pulse";
          } else if (isGenerated) {
            chipClass += "bg-emerald-900/30 text-emerald-400";
          } else {
            chipClass += "bg-zinc-800 text-zinc-500";
          }

          return (
            <div key={file.path} className={chipClass} title={file.path}>
              {filename}
            </div>
          );
        })}
      </div>
    </div>
  );
}
