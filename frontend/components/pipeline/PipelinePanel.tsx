"use client";

import { PipelineState, STAGES } from "@/types/pipeline";
import { StageProgress } from "./StageProgress";
import { StageCard } from "./StageCard";
import { TokenCounter } from "./TokenCounter";
import { FileManifestView } from "./FileManifestView";
import { FileGenerationProgress } from "./FileGenerationProgress";
import { cn } from "@/lib/utils";

const TOKEN_BUDGET = 40000;

interface Props {
  state: PipelineState;
}

export function PipelinePanel({ state }: Props) {
  const hasStarted =
    state.isStreaming ||
    state.finalCode !== null ||
    Object.values(state.stageOutputs).some((o) => o.length > 0) ||
    state.manifest !== null ||
    Object.keys(state.generatedFiles).length > 0;

  const isMultiFile = state.mode === "multi_file";

  const generatedPaths = new Set(Object.keys(state.generatedFiles));
  const errorPaths = new Set(Object.keys(state.errorFiles));

  // Multi-file completion check
  const multiFileComplete =
    isMultiFile && !state.isStreaming && Object.keys(state.generatedFiles).length > 0;

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-zinc-300">Pipeline</h2>
        {state.isStreaming && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-blue-400">Running</span>
          </div>
        )}
        {(state.finalCode || multiFileComplete) && !state.isStreaming && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-400">Complete</span>
          </div>
        )}
      </div>

      {/* Single-file stage progress bar */}
      {hasStarted && !isMultiFile && (
        <StageProgress
          statuses={state.stageStatuses}
          activeStage={state.activeStage as import("@/types/pipeline").StageName | null}
        />
      )}

      {/* Warnings / errors */}
      {state.warning && (
        <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 rounded-md px-3 py-2 shrink-0">
          ⚠️ {state.warning}
        </div>
      )}

      {state.error && (
        <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2 shrink-0">
          ✖ {state.error}
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          "flex flex-col gap-3 flex-1 overflow-y-auto",
          !hasStarted && "items-center justify-center"
        )}
      >
        {!hasStarted ? (
          /* Empty state */
          <div className="text-center text-zinc-600 select-none py-12">
            <div className="text-4xl mb-3">⚡</div>
            <p className="text-sm font-medium">Enter a coding prompt to start</p>
            <p className="text-xs mt-1">4 Gemini models will collaborate to build your code</p>
            <div className="mt-4 flex flex-col gap-1">
              {STAGES.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-2 justify-center text-xs text-zinc-600"
                >
                  <span>{s.icon}</span>
                  <span className={s.color}>{s.displayName}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-zinc-700">{s.model}</span>
                </div>
              ))}
            </div>
          </div>
        ) : isMultiFile ? (
          /* Multi-file view */
          <div className="flex flex-col gap-4">
            {state.manifest && (
              <FileManifestView
                manifest={state.manifest}
                generatedPaths={generatedPaths}
                errorPaths={errorPaths}
              />
            )}
            {(state.manifest?.files ?? []).length > 0 && (
              <FileGenerationProgress
                files={state.manifest!.files}
                generatedPaths={generatedPaths}
                errorPaths={errorPaths}
                activeFilePath={state.activeFilePath}
              />
            )}
            {/* Project path on completion */}
            {state.projectPath && !state.isStreaming && (
              <div className="text-[10px] text-zinc-500 bg-zinc-800/50 rounded px-2 py-1.5 break-all">
                <span className="text-zinc-400">Project: </span>
                {state.projectPath}
              </div>
            )}
          </div>
        ) : (
          /* Single-file stage cards */
          STAGES.map((stage) => (
            <StageCard
              key={stage.name}
              stage={stage}
              status={state.stageStatuses[stage.name]}
              output={state.stageOutputs[stage.name]}
              tokenCount={state.stageTokens[stage.name]}
              isActive={state.activeStage === stage.name}
            />
          ))
        )}
      </div>

      {/* Token counter */}
      {hasStarted && (
        <TokenCounter
          stageTokens={state.stageTokens}
          total={state.totalTokens}
          budget={TOKEN_BUDGET}
        />
      )}
    </div>
  );
}
