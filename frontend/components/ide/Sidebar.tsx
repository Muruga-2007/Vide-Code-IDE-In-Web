"use client";

import type { PipelineState } from "@/types/pipeline";
import type { StartPipelineOptions } from "@/hooks/usePipelineStream";
import type { FileNode } from "@/types/filesystem";
import { FileExplorer } from "@/components/explorer/FileExplorer";
import { AIGeneratePanel } from "@/components/ai-generate/AIGeneratePanel";

type ActivityView = "explorer" | "ai-generate" | "terminal";

interface Props {
  activeView: ActivityView;
  pipelineState: PipelineState;
  onGenerate: (prompt: string, language: string, options: StartPipelineOptions) => void;
  isGenerating: boolean;
  onReset: () => void;
  hasResult: boolean;
  onFileOpen: (node: FileNode) => void;
  refreshTrigger: number;
}

const VIEW_HEADERS: Record<ActivityView, string> = {
  explorer: "Explorer",
  "ai-generate": "AI Generate",
  terminal: "Terminal",
};

export function Sidebar({
  activeView,
  pipelineState: _pipelineState,
  onGenerate,
  isGenerating,
  onReset,
  hasResult,
  onFileOpen,
  refreshTrigger,
}: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-900 border-r border-zinc-800">
      {/* Section header */}
      <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 px-3 py-2 border-b border-zinc-800 shrink-0">
        {VIEW_HEADERS[activeView]}
      </div>

      {/* View content */}
      <div className="flex-1 overflow-hidden">
        {activeView === "explorer" && (
          <FileExplorer onFileOpen={onFileOpen} refreshTrigger={refreshTrigger} />
        )}

        {activeView === "ai-generate" && (
          <AIGeneratePanel
            onGenerate={onGenerate}
            isGenerating={isGenerating}
            onReset={onReset}
            hasResult={hasResult}
          />
        )}

        {activeView === "terminal" && (
          <div className="flex items-center justify-center h-full px-4 text-center">
            <p className="text-xs text-zinc-500">
              Open the Terminal panel below ↓
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
