"use client";

import { useEffect, useRef, useState } from "react";
import { FilePlus, FolderPlus, PencilLine, Trash2 } from "lucide-react";
import type { FileNode } from "@/types/filesystem";

interface Props {
  node: FileNode;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: (node: FileNode, newName: string) => void;
  onDelete: (node: FileNode) => void;
  onNewFile: (parentPath: string) => void;
  onNewFolder: (parentPath: string) => void;
}

export function FileContextMenu({
  node,
  position,
  onClose,
  onRename,
  onDelete,
  onNewFile,
  onNewFolder,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Focus input when rename mode activates
  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== node.name) {
      onRename(node, trimmed);
    }
    onClose();
  };

  const parentPath =
    node.type === "folder"
      ? node.path
      : node.path.slice(0, node.path.lastIndexOf("/")) || node.path.slice(0, node.path.lastIndexOf("\\")) || "";

  const itemClass =
    "px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 cursor-pointer flex items-center gap-2 select-none";

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl py-1 min-w-[160px]"
      style={{ top: position.y, left: position.x }}
    >
      {renaming ? (
        <div className="px-2 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") onClose();
            }}
            className="w-full text-xs bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>
      ) : (
        <>
          <div
            className={itemClass}
            onClick={() => {
              onNewFile(parentPath);
              onClose();
            }}
          >
            <FilePlus size={12} />
            New File
          </div>

          {node.type === "folder" && (
            <div
              className={itemClass}
              onClick={() => {
                onNewFolder(parentPath);
                onClose();
              }}
            >
              <FolderPlus size={12} />
              New Folder
            </div>
          )}

          <div className="border-t border-zinc-700 my-1" />

          <div
            className={itemClass}
            onClick={() => setRenaming(true)}
          >
            <PencilLine size={12} />
            Rename
          </div>

          <div
            className={itemClass + " text-red-400 hover:text-red-300"}
            onClick={() => {
              onDelete(node);
              onClose();
            }}
          >
            <Trash2 size={12} />
            Delete
          </div>
        </>
      )}
    </div>
  );
}
