"use client";

import { useState, useCallback } from "react";
import { EditorTab, FileNode } from "@/types/filesystem";
import { extToLanguage } from "@/lib/language-map";

let tabIdCounter = 0;
function nextId() {
  return `tab-${++tabIdCounter}`;
}

export function useEditorTabs(writeFile: (path: string, content: string) => Promise<void>) {
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  /** Open a file in a tab. If already open, just activate it. */
  const openFile = useCallback(
    (node: FileNode, content: string) => {
      setTabs((prev) => {
        const existing = prev.find((t) => t.path === node.path);
        if (existing) {
          setActiveTabId(existing.id);
          return prev;
        }
        const tab: EditorTab = {
          id: nextId(),
          path: node.path,
          filename: node.name,
          language: extToLanguage(node.name),
          content,
          isDirty: false,
        };
        setActiveTabId(tab.id);
        return [...prev, tab];
      });
    },
    []
  );

  /** Open by path + content (used by file_created SSE events). */
  const openByPath = useCallback(
    (path: string, content: string) => {
      const filename = path.split(/[\\/]/).pop() ?? path;
      const fakeNode: FileNode = {
        name: filename,
        path,
        type: "file",
        extension: filename.slice(filename.lastIndexOf(".")),
        size: content.length,
        modified: Date.now() / 1000,
        children: null,
      };
      openFile(fakeNode, content);
    },
    [openFile]
  );

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const remaining = prev.filter((t) => t.id !== id);
      setActiveTabId((cur) => {
        if (cur !== id) return cur;
        if (remaining.length === 0) return null;
        const newIdx = Math.min(idx, remaining.length - 1);
        return remaining[newIdx].id;
      });
      return remaining;
    });
  }, []);

  const updateContent = useCallback((id: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, content, isDirty: true } : t))
    );
  }, []);

  const saveTab = useCallback(
    async (id: string) => {
      const tab = tabs.find((t) => t.id === id);
      if (!tab) return;
      await writeFile(tab.path, tab.content);
      setTabs((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isDirty: false } : t))
      );
    },
    [tabs, writeFile]
  );

  /** Update content without marking dirty (used when AI writes a file) */
  const syncContent = useCallback((path: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, content, isDirty: false } : t))
    );
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  return {
    tabs,
    activeTabId,
    activeTab,
    openFile,
    openByPath,
    closeTab,
    setActiveTabId,
    updateContent,
    saveTab,
    syncContent,
  };
}
