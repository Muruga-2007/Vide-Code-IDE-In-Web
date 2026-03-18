"use client";

interface Props {
  language: string | null;
  line: number;
  column: number;
  totalTokens: number;
  tokenBudget: number;
  activeModel: string | null;
  projectPath: string | null;
}

export function StatusBar({
  language,
  line,
  column,
  totalTokens,
  tokenBudget,
  activeModel,
  projectPath,
}: Props) {
  const projectName = projectPath
    ? projectPath.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? projectPath
    : null;

  const pct = tokenBudget > 0 ? Math.min(100, Math.round((totalTokens / tokenBudget) * 100)) : 0;
  const budgetColor =
    pct >= 90 ? "bg-red-500" :
    pct >= 70 ? "bg-amber-500" :
    "bg-blue-400";

  return (
    <div className="flex items-center justify-between px-3 h-6 text-[10px] bg-blue-700 text-white shrink-0 select-none overflow-hidden">
      {/* Left section */}
      <div className="flex items-center gap-2 min-w-0">
        {language && (
          <>
            <span className="capitalize shrink-0">{language}</span>
            <span className="opacity-50">|</span>
          </>
        )}
        <span className="shrink-0">Ln {line}, Col {column}</span>
        {projectName && (
          <>
            <span className="opacity-50 shrink-0">|</span>
            <span className="opacity-90 truncate max-w-[160px]" title={projectPath ?? undefined}>
              {projectName}
            </span>
          </>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Active model indicator */}
        {activeModel && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
            <span className="opacity-90 text-[9px]">{activeModel}</span>
            <span className="opacity-50">|</span>
          </div>
        )}

        {/* Token budget meter */}
        {totalTokens > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="opacity-75">
              {totalTokens.toLocaleString()}/{tokenBudget.toLocaleString()} tok
            </span>
            {/* Gauge bar */}
            <div className="w-16 h-1.5 bg-blue-900/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${budgetColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="opacity-60 text-[9px]">{pct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
