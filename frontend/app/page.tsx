"use client";

import { usePipelineStream } from "@/hooks/usePipelineStream";
import { PromptInput } from "@/components/editor/PromptInput";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { PipelinePanel } from "@/components/pipeline/PipelinePanel";

export default function Home() {
  const { state, startPipeline, reset } = usePipelineStream();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="font-bold text-sm tracking-tight text-zinc-100">Vibe Coding Tool</span>
          <span className="text-[10px] text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">
            4-Model Gemini Pipeline
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>🧠 2.5-pro</span>
          <span>⚡ 2.5-flash</span>
          <span>🔍 2.0-thinking</span>
          <span>✨ 2.0-flash</span>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="flex flex-col w-[400px] shrink-0 border-r border-zinc-800 overflow-y-auto">
          <div className="p-4 border-b border-zinc-800">
            <PromptInput
              onSubmit={startPipeline}
              isLoading={state.isStreaming}
              onReset={reset}
              hasResult={!!state.finalCode}
            />
          </div>
          <div className="flex-1 p-4 min-h-[300px]">
            <CodeEditor
              code={state.finalCode ?? ""}
              language={state.language}
            />
          </div>
        </div>

        {/* Right panel — pipeline */}
        <div className="flex-1 p-4 overflow-y-auto">
          <PipelinePanel state={state} />
        </div>
      </main>
    </div>
  );
}
