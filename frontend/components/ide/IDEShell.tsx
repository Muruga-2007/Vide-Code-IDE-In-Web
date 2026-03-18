"use client";

import { useState, useCallback, useEffect } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Save } from "lucide-react";

import { ActivityBar } from "./ActivityBar";
import { Sidebar } from "./Sidebar";
import { EditorArea } from "./EditorArea";
import { PanelArea } from "./PanelArea";
import { StatusBar } from "./StatusBar";
import { CheckpointPanel } from "@/components/checkpoints/CheckpointPanel";
import { PlanReviewPanel } from "@/components/plan/PlanReviewPanel";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useEditorTabs } from "@/hooks/useEditorTabs";
import { usePipelineStream } from "@/hooks/usePipelineStream";
import type { FileManifest, ChatMessage } from "@/types/pipeline";
import type { FileNode } from "@/types/filesystem";

type ActivityView = "explorer" | "ai-generate" | "terminal";
type PanelTab = "terminal" | "pipeline" | "output" | "preview";

export function IDEShell() {
  const [activeView, setActiveView]       = useState<ActivityView>("ai-generate");
  const [activePanel, setActivePanel]     = useState<PanelTab>("pipeline");
  const [explorerRefresh, setExplorerRefresh] = useState(0);
  const [cursor, setCursor]               = useState({ line: 1, col: 1 });
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [chatHistory, setChatHistory]     = useState<ChatMessage[]>([]);

  const fileSystem = useFileSystem();
  const editorTabs = useEditorTabs(fileSystem.writeFile);

  const handleFileCreated = useCallback(
    (relativePath: string, content: string) => {
      editorTabs.openByPath(relativePath, content);
      setExplorerRefresh((n) => n + 1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleManifestReady = useCallback((_manifest: FileManifest) => {
    setActivePanel("pipeline");
  }, []);

  const { state: pipelineState, startPipeline, executePlan, reset: resetPipeline } =
    usePipelineStream(handleFileCreated, handleManifestReady);

  const handleFileOpen = useCallback(
    async (node: FileNode) => {
      try {
        const content = await fileSystem.readFile(node.path);
        editorTabs.openFile(node, content);
      } catch (e) {
        console.error("Failed to open file:", e);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Sync AI-updated files into any already-open tabs
  useEffect(() => {
    Object.entries(pipelineState.generatedFiles).forEach(([path, content]) => {
      editorTabs.syncContent(path, content);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineState.generatedFiles]);

  // When generation completes, refresh explorer + update last chat message
  useEffect(() => {
    if (!pipelineState.isStreaming && (pipelineState.projectName || pipelineState.finalCode)) {
      setExplorerRefresh((n) => n + 1);
      setChatHistory((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            projectName: pipelineState.projectName ?? undefined,
            fileCount: Object.keys(pipelineState.generatedFiles).length || undefined,
          },
        ];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineState.isStreaming]);

  // Load workspace tree on mount
  useEffect(() => {
    fileSystem.fetchTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddChatMessage = useCallback((msg: Omit<ChatMessage, "id">) => {
    setChatHistory((prev) => [
      ...prev,
      { ...msg, id: `${Date.now()}-${Math.random()}` },
    ]);
  }, []);

  const handleExecutePlan = useCallback(
    (manifest: FileManifest) => {
      executePlan(manifest);
      setActivePanel("pipeline");
      setActiveView("explorer");
    },
    [executePlan]
  );

  const handleDiscardPlan = useCallback(() => {
    resetPipeline();
  }, [resetPipeline]);

  const activeTab = editorTabs.activeTab;

  // Show plan review overlay when planReady
  const showPlanReview = pipelineState.planReady && pipelineState.manifest;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar activeView={activeView} onViewChange={setActiveView} />

        {/* Main horizontal split */}
        <Group orientation="horizontal" className="flex-1" style={{ height: "100%" }}>
          <Panel defaultSize={22} minSize={15} maxSize={40}>
            {/* Show PlanReview overlay when plan is ready */}
            {showPlanReview ? (
              <PlanReviewPanel
                manifest={pipelineState.manifest!}
                onExecute={handleExecutePlan}
                onDiscard={handleDiscardPlan}
                isExecuting={pipelineState.isStreaming}
              />
            ) : (
              <Sidebar
                activeView={activeView}
                pipelineState={pipelineState}
                onGenerate={startPipeline}
                isGenerating={pipelineState.isStreaming}
                onReset={resetPipeline}
                hasResult={
                  !!pipelineState.finalCode ||
                  Object.keys(pipelineState.generatedFiles).length > 0
                }
                onFileOpen={handleFileOpen}
                refreshTrigger={explorerRefresh}
                chatHistory={chatHistory}
                onAddChatMessage={handleAddChatMessage}
              />
            )}
          </Panel>

          <Separator className="w-1 bg-zinc-800 hover:bg-blue-500/40 transition-colors cursor-col-resize" />

          <Panel defaultSize={78}>
            <Group orientation="vertical" style={{ height: "100%" }}>
              <Panel defaultSize={65} minSize={25}>
                <EditorArea
                  tabs={editorTabs.tabs}
                  activeTabId={editorTabs.activeTabId}
                  onTabSelect={editorTabs.setActiveTabId}
                  onTabClose={editorTabs.closeTab}
                  onContentChange={editorTabs.updateContent}
                  onSave={editorTabs.saveTab}
                  onCursorChange={(line, col) => setCursor({ line, col })}
                />
              </Panel>

              <Separator className="h-1 bg-zinc-800 hover:bg-blue-500/40 transition-colors cursor-row-resize" />

              <Panel defaultSize={35} minSize={15}>
                <PanelArea
                  activePanel={activePanel}
                  onPanelChange={setActivePanel}
                  pipelineState={pipelineState}
                  onRefreshExplorer={() => setExplorerRefresh((n) => n + 1)}
                />
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>

      {/* Status Bar */}
      <StatusBar
        language={activeTab?.language ?? null}
        line={cursor.line}
        column={cursor.col}
        totalTokens={pipelineState.totalTokens}
        tokenBudget={40000}
        activeModel={pipelineState.activeStage ?? null}
        projectPath={pipelineState.projectPath}
      />

      {/* Checkpoint button (bottom-right corner) */}
      <button
        onClick={() => setCheckpointOpen(true)}
        className="fixed bottom-8 right-4 z-40 flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg shadow-lg transition-colors"
        title="Manage checkpoints"
      >
        <Save size={11} />
        Checkpoints
      </button>

      {/* Checkpoint modal */}
      {checkpointOpen && (
        <CheckpointPanel
          onClose={() => setCheckpointOpen(false)}
          onRestored={() => {
            setExplorerRefresh((n) => n + 1);
            setCheckpointOpen(false);
          }}
        />
      )}
    </div>
  );
}
