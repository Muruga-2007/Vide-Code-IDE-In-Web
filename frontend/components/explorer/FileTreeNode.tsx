"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FileCode,
  Braces,
  Folder,
  FolderOpen,
} from "lucide-react";
import type { FileNode } from "@/types/filesystem";

interface Props {
  node: FileNode;
  depth: number;
  onFileOpen: (node: FileNode) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
}

function getFileIcon(filename: string) {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  switch (ext) {
    case ".py":
      return <FileCode size={13} className="text-yellow-400 shrink-0" />;
    case ".ts":
    case ".tsx":
      return <FileCode size={13} className="text-blue-400 shrink-0" />;
    case ".js":
    case ".jsx":
      return <FileCode size={13} className="text-yellow-300 shrink-0" />;
    case ".json":
      return <Braces size={13} className="text-orange-400 shrink-0" />;
    case ".md":
      return <FileText size={13} className="text-zinc-400 shrink-0" />;
    default:
      return <FileText size={13} className="text-zinc-400 shrink-0" />;
  }
}

export function FileTreeNode({ node, depth, onFileOpen, onContextMenu }: Props) {
  const [expanded, setExpanded] = useState(false);

  const paddingLeft = depth * 12 + 8;

  if (node.type === "folder") {
    return (
      <div>
        <div
          className="flex items-center gap-1 py-0.5 cursor-pointer hover:bg-zinc-800/60 rounded text-xs text-zinc-300 select-none"
          style={{ paddingLeft }}
          onClick={() => setExpanded((v) => !v)}
          onContextMenu={(e) => onContextMenu(e, node)}
        >
          <span className="text-zinc-500 shrink-0">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
          {expanded ? (
            <FolderOpen size={13} className="text-yellow-500 shrink-0" />
          ) : (
            <Folder size={13} className="text-yellow-500 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {expanded && node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                onFileOpen={onFileOpen}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 py-0.5 cursor-pointer hover:bg-zinc-800/60 rounded text-xs text-zinc-300 select-none"
      style={{ paddingLeft }}
      onClick={() => onFileOpen(node)}
      onContextMenu={(e) => onContextMenu(e, node)}
    >
      <span className="w-3 shrink-0" />
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </div>
  );
}
