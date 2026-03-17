"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { EditorTab } from "@/types/filesystem";

interface Props {
  tab: EditorTab;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export function EditorTabItem({ tab, isActive, onSelect, onClose }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={
        "flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer border-r border-zinc-800 shrink-0 select-none transition-colors " +
        (isActive
          ? "bg-zinc-900 text-zinc-100 border-b-2 border-b-blue-500"
          : "bg-zinc-950 text-zinc-500 hover:bg-zinc-800/50 border-b-2 border-b-transparent")
      }
    >
      <span className="max-w-[120px] truncate">{tab.filename}</span>
      {tab.isDirty && !hovered && (
        <span className="text-blue-400 text-[10px] leading-none">●</span>
      )}
      {(hovered || tab.isDirty) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex items-center justify-center w-3.5 h-3.5 rounded hover:bg-zinc-600/60 text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Close tab"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}
