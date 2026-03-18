"use client";

import { useState, useCallback, useEffect } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { ActivityBar } from "./ActivityBar";
import { Sidebar } from "./Sidebar";
import { EditorArea } from "./EditorArea";
import { PanelArea } from "./PanelArea";
import { StatusBar } from "./StatusBar";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useEditorTabs } from "@/hooks/useEditorTabs";
import { usePipelineStream } from "@/hooks/usePipelineStream";
import type { FileManifest } from "@/types/pipeline";
import type { FileNode } from "@/types/filesystem";

type ActivityView = "explorer" | "ai-generate" | "terminal";
type PanelTab = "terminal" | "pipeline" | "output";

export function IDEShell() {
  const [activeView, setActiveView] = useState<ActivityView>("explorer");
  const [activePanel, setActivePanel] = useState<PanelTab>("pipeline");
  const [explorerRefresh, setExplorerRefresh] = useState(0);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });

  const fileSystem = useFileSystem();
  const editorTabs = useEditorTabs(fileSystem.writeFile);

  const handleFileCreated = useCallback(
    (relativePath: string, content: string) => {
      editorTabs.openByPath(relativePath, content);
      setExplorerRefresh((n) => n + 1);
      setActivePanel("pipeline");
    },
    // editorTabs is stable — useEditorTabs uses useCallback internally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleManifestReady = useCallback((_manifest: FileManifest) => {
    setActivePanel("pipeline");
  }, []);

  const { state: pipelineState, startPipeline, reset: resetPipeline } =
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

  // Load workspace tree on mount
  useEffect(() => {
    fileSystem.fetchTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTab = editorTabs.activeTab;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar — leftmost icon strip */}
        <ActivityBar activeView={activeView} onViewChange={setActiveView} />

        {/* Horizontal split: Sidebar | Editor+Panel */}
        <Group orientation="horizontal" className="flex-1">
          <Panel defaultSize="22%" minSize="15%" maxSize="40%">
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
            />
          </Panel>

          <Separator className="w-1 bg-zinc-800 hover:bg-blue-500/40 transition-colors cursor-col-resize" />

          {/* Right side: vertical split — editor on top, panel on bottom */}
          <Panel defaultSize="78%">
            <Group orientation="vertical" className="h-full">
              <Panel defaultSize="65%" minSize="25%">
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

              <Panel defaultSize="35%" minSize="15%">
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
    </div>
  );
}
