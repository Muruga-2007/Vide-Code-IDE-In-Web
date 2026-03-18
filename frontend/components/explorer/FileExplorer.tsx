"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useFileSystem } from "@/hooks/useFileSystem";
import { FileTreeNode } from "./FileTreeNode";
import { FileContextMenu } from "./FileContextMenu";
import type { FileNode } from "@/types/filesystem";

interface Props {
  onFileOpen: (node: FileNode) => void;
  refreshTrigger: number;
}

interface ContextMenuState {
  node: FileNode;
  position: { x: number; y: number };
}

export function FileExplorer({ onFileOpen, refreshTrigger }: Props) {
  const { tree, loading, error, fetchTree, createFile, deleteFile, renameFile } = useFileSystem();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    fetchTree();
  }, [refreshTrigger]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ node, position: { x: e.clientX, y: e.clientY } });
  }, []);

  const handleNewFile = useCallback(
    async (parentPath: string) => {
      const name = window.prompt("New file name:");
      if (!name?.trim()) return;
      const sep = parentPath ? "/" : "";
      await createFile(`${parentPath}${sep}${name.trim()}`, "file");
      await fetchTree();
    },
    [createFile, fetchTree]
  );

  const handleNewFolder = useCallback(
    async (parentPath: string) => {
      const name = window.prompt("New folder name:");
      if (!name?.trim()) return;
      const sep = parentPath ? "/" : "";
      await createFile(`${parentPath}${sep}${name.trim()}`, "folder");
      await fetchTree();
    },
    [createFile, fetchTree]
  );

  const handleDelete = useCallback(
    async (node: FileNode) => {
      const confirmed = window.confirm(`Delete "${node.name}"?`);
      if (!confirmed) return;
      await deleteFile(node.path);
      await fetchTree();
    },
    [deleteFile, fetchTree]
  );

  const handleRename = useCallback(
    async (node: FileNode, newName: string) => {
      const dir = node.path.includes("/")
        ? node.path.slice(0, node.path.lastIndexOf("/"))
        : node.path.includes("\\")
        ? node.path.slice(0, node.path.lastIndexOf("\\"))
        : "";
      const newPath = dir ? `${dir}/${newName}` : newName;
      await renameFile(node.path, newPath);
      await fetchTree();
    },
    [renameFile, fetchTree]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto py-1 px-1">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-zinc-500" />
          </div>
        )}

        {error && !loading && (
          <div className="px-3 py-2 text-xs text-red-400">{error}</div>
        )}

        {!loading && !error && tree.length === 0 && (
          <div className="px-3 py-4 text-xs text-zinc-600 text-center">
            No files yet.
            <br />
            Generate a project to get started.
          </div>
        )}

        {!loading &&
          tree.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              depth={0}
              onFileOpen={onFileOpen}
              onContextMenu={handleContextMenu}
            />
          ))}
      </div>

      {contextMenu && (
        <FileContextMenu
          node={contextMenu.node}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
          onDelete={handleDelete}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
        />
      )}
    </div>
  );
}
