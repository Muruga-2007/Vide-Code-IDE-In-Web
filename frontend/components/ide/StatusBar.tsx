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

  return (
    <div className="flex items-center justify-between px-3 h-6 text-[10px] bg-blue-600 text-white shrink-0 select-none">
      {/* Left section */}
      <div className="flex items-center gap-2">
        {language && (
          <>
            <span className="capitalize">{language}</span>
            <span className="opacity-60">|</span>
          </>
        )}
        <span>
          Ln {line}, Col {column}
        </span>
        {projectName && (
          <>
            <span className="opacity-60">|</span>
            <span className="opacity-90 max-w-[200px] truncate" title={projectPath ?? undefined}>
              {projectName}
            </span>
          </>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {activeModel && (
          <>
            <span className="opacity-90">{activeModel}</span>
            <span className="opacity-60">|</span>
          </>
        )}
        {totalTokens > 0 && (
          <span>
            Tokens: {totalTokens.toLocaleString()} / {tokenBudget.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
