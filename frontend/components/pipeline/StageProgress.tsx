"use client";

import { STAGES, StageStatus, StageName } from "@/types/pipeline";
import { cn } from "@/lib/utils";

interface Props {
  statuses: Record<StageName, StageStatus>;
  activeStage: StageName | null;
}

export function StageProgress({ statuses, activeStage }: Props) {
  return (
    <div className="flex items-center gap-1 w-full">
      {STAGES.map((stage, i) => {
        const status = statuses[stage.name];
        const isActive = activeStage === stage.name;

        return (
          <div key={stage.name} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
                  status === "complete" && "bg-emerald-500 border-emerald-500 text-white",
                  isActive && "border-blue-400 bg-blue-400/10 text-blue-400 animate-pulse",
                  status === "pending" && !isActive && "border-zinc-600 text-zinc-500",
                  status === "error" && "border-red-500 bg-red-500/10 text-red-400",
                )}
              >
                {status === "complete" ? "✓" : stage.icon}
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                isActive ? "text-blue-400" : status === "complete" ? "text-emerald-400" : "text-zinc-500"
              )}>
                {stage.displayName}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={cn(
                "h-0.5 flex-1 mx-1 rounded transition-all duration-500",
                statuses[STAGES[i + 1].name] !== "pending" || activeStage === STAGES[i + 1].name
                  ? "bg-blue-400/50"
                  : "bg-zinc-700"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
