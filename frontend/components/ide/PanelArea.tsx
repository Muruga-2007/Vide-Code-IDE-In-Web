"use client";

import dynamic from "next/dynamic";
import type { PipelineState } from "@/types/pipeline";
import { PipelinePanel } from "@/components/pipeline/PipelinePanel";
import { PreviewPanel } from "@/components/preview/PreviewPanel";

const TerminalPanel = dynamic(
  () => import("@/components/terminal/TerminalPanel").then((m) => m.TerminalPanel),
  { ssr: false }
);

type PanelTab = "terminal" | "pipeline" | "output" | "preview";

interface Props {
  activePanel: PanelTab;
  onPanelChange: (p: PanelTab) => void;
  pipelineState: PipelineState;
  onRefreshExplorer: () => void;
}

const TABS: { id: PanelTab; label: string }[] = [
  { id: "terminal", label: "Terminal" },
  { id: "pipeline", label: "Pipeline" },
  { id: "output",   label: "Output"   },
  { id: "preview",  label: "Preview"  },
];

export function PanelArea({ activePanel, onPanelChange, pipelineState, onRefreshExplorer }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-zinc-800 bg-zinc-950 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onPanelChange(tab.id)}
            className={
              "px-4 py-1.5 text-xs border-b-2 transition-colors " +
              (activePanel === tab.id
                ? "border-b-blue-500 text-zinc-100"
                : "border-b-transparent text-zinc-500 hover:text-zinc-300")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-auto relative">
        {/* Terminal — always mounted, just hidden when not active */}
        <div
          className="absolute inset-0"
          style={{ display: activePanel === "terminal" ? "block" : "none" }}
        >
          <TerminalPanel isActive={activePanel === "terminal"} />
        </div>

        {/* Pipeline */}
        {activePanel === "pipeline" && (
          <div className="absolute inset-0 overflow-y-auto">
            <PipelinePanel state={pipelineState} />
          </div>
        )}

        {/* Output */}
        {activePanel === "output" && (
          <div className="absolute inset-0 overflow-y-auto p-4 space-y-3">
            <OutputPanel state={pipelineState} onRefreshExplorer={onRefreshExplorer} />
          </div>
        )}

        {/* Preview */}
        {activePanel === "preview" && (
          <div className="absolute inset-0">
            <PreviewPanel defaultPort={3000} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline Output panel ──────────────────────────────────────────────────────

function OutputPanel({
  state,
  onRefreshExplorer,
}: {
  state: PipelineState;
  onRefreshExplorer: () => void;
}) {
  const totalFiles = Object.keys(state.generatedFiles).length;
  const errorFiles = Object.keys(state.errorFiles).length;

  if (!state.finalCode && totalFiles === 0 && !state.projectPath) {
    return (
      <div className="text-xs text-zinc-600 text-center py-8">
        No output yet. Run a generation to see results here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Token summary */}
      {state.totalTokens > 0 && (
        <div className="flex items-center gap-4 text-xs bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2">
          <div>
            <span className="text-zinc-500">Total tokens: </span>
            <span className="text-zinc-300 font-mono">{state.totalTokens.toLocaleString()}</span>
          </div>
          {Object.entries(state.stageTokens)
            .filter(([, v]) => v > 0)
            .map(([stage, count]) => (
              <div key={stage}>
                <span className="text-zinc-500 capitalize">{stage}: </span>
                <span className="text-zinc-400 font-mono">{count.toLocaleString()}</span>
              </div>
            ))}
        </div>
      )}

      {/* Project path */}
      {state.projectPath && (
        <div className="text-xs bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2">
          <div className="text-zinc-500 mb-1">Project generated at:</div>
          <div className="text-emerald-400 font-mono break-all text-[11px]">{state.projectPath}</div>
          <button
            onClick={onRefreshExplorer}
            className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 underline"
          >
            Refresh Explorer
          </button>
        </div>
      )}

      {/* File counts */}
      {totalFiles > 0 && (
        <div className="flex gap-3 text-xs">
          <div className="bg-emerald-900/30 text-emerald-400 rounded px-2 py-1">
            {totalFiles} files generated
          </div>
          {errorFiles > 0 && (
            <div className="bg-red-900/30 text-red-400 rounded px-2 py-1">
              {errorFiles} errors
            </div>
          )}
        </div>
      )}

      {/* Single-file code preview */}
      {state.finalCode && (
        <div>
          <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-widest">
            Generated Code
          </div>
          <pre className="text-[11px] text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-md p-3 overflow-x-auto max-h-64 font-mono leading-relaxed">
            {state.finalCode}
          </pre>
        </div>
      )}
    </div>
  );
}
