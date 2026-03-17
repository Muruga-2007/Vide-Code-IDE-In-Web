"use client";

import { StageName, STAGES } from "@/types/pipeline";
import { cn } from "@/lib/utils";

interface Props {
  stageTokens: Record<StageName, number>;
  total: number;
  budget: number;
}

export function TokenCounter({ stageTokens, total, budget }: Props) {
  const pct = Math.min((total / budget) * 100, 100);
  const barColor = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-400">Token Usage</span>
        <span className={cn("text-xs font-mono font-bold", pct > 80 ? "text-red-400" : "text-zinc-300")}>
          {total.toLocaleString()} / {budget.toLocaleString()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Per-stage breakdown */}
      <div className="grid grid-cols-2 gap-1">
        {STAGES.map((s) => (
          stageTokens[s.name] > 0 && (
            <div key={s.name} className="flex items-center justify-between">
              <span className={cn("text-[10px]", s.color)}>{s.displayName}</span>
              <span className="text-[10px] font-mono text-zinc-500">
                {stageTokens[s.name].toLocaleString()}
              </span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
