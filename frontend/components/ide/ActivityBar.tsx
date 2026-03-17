"use client";

import { FolderOpen, Sparkles, Terminal as TerminalIcon } from "lucide-react";

type ActivityView = "explorer" | "ai-generate" | "terminal";

interface Props {
  activeView: ActivityView;
  onViewChange: (view: ActivityView) => void;
}

interface NavItem {
  id: ActivityView;
  icon: React.ReactNode;
  label: string;
}

export function ActivityBar({ activeView, onViewChange }: Props) {
  const items: NavItem[] = [
    { id: "explorer", icon: <FolderOpen size={20} />, label: "Explorer" },
    { id: "ai-generate", icon: <Sparkles size={20} />, label: "AI Generate" },
    { id: "terminal", icon: <TerminalIcon size={20} />, label: "Terminal" },
  ];

  return (
    <div className="flex flex-col w-12 shrink-0 bg-zinc-900 border-r border-zinc-800">
      {items.map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            title={item.label}
            onClick={() => onViewChange(item.id)}
            className={
              "w-full py-3 flex items-center justify-center transition-colors " +
              (isActive
                ? "text-blue-400 bg-zinc-800"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50")
            }
          >
            {item.icon}
          </button>
        );
      })}
    </div>
  );
}
