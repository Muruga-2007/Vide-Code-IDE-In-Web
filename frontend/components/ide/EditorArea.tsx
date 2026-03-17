"use client";

import { useRef, useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Sparkles } from "lucide-react";
import type { EditorTab } from "@/types/filesystem";
import { EditorTabItem } from "./EditorTab";

interface Props {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
  onSave: (id: string) => void;
  onCursorChange?: (line: number, col: number, language: string) => void;
}

export function EditorArea({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onContentChange,
  onSave,
  onCursorChange,
}: Props) {
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;
  // Keep a stable ref to activeTabId for use inside Monaco callbacks
  const activeTabIdRef = useRef<string | null>(activeTabId);
  activeTabIdRef.current = activeTabId;

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      // Ctrl+S → save
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const id = activeTabIdRef.current;
        if (id) onSave(id);
      });

      // Cursor position changes
      editor.onDidChangeCursorPosition((e) => {
        const id = activeTabIdRef.current;
        if (!id) return;
        const tab = tabs.find((t) => t.id === id);
        onCursorChange?.(
          e.position.lineNumber,
          e.position.column,
          tab?.language ?? "plaintext"
        );
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSave, onCursorChange]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto bg-zinc-950 border-b border-zinc-800 shrink-0 scrollbar-none">
        {tabs.map((tab) => (
          <EditorTabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSelect={() => onTabSelect(tab.id)}
            onClose={() => onTabClose(tab.id)}
          />
        ))}
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-hidden">
        {tabs.length === 0 || !activeTab ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600 select-none">
            <Sparkles size={32} className="text-zinc-700" />
            <p className="text-sm font-medium text-zinc-500">Open a file or generate a project</p>
            <p className="text-xs text-zinc-600">
              Use the Explorer or AI Generate panel on the left
            </p>
          </div>
        ) : (
          <Editor
            key={activeTab.id}
            height="100%"
            theme="vs-dark"
            language={activeTab.language}
            value={activeTab.content}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              fontFamily: "var(--font-geist-mono), 'Cascadia Code', 'Fira Code', monospace",
              renderLineHighlight: "all",
              lineNumbers: "on",
              tabSize: 2,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              padding: { top: 8, bottom: 8 },
            }}
            onMount={handleEditorMount}
            onChange={(value) => {
              const id = activeTabIdRef.current;
              if (id && value !== undefined) {
                onContentChange(id, value);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
