"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StageInfo, StageStatus } from "@/types/pipeline";
import { cn } from "@/lib/utils";

interface Props {
  stage: StageInfo;
  status: StageStatus;
  output: string;
  tokenCount: number;
  isActive: boolean;
}

export function StageCard({ stage, status, output, tokenCount, isActive }: Props) {
  const scrollRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (isActive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, isActive]);

  const statusBadge = {
    pending:   { label: "Waiting",   className: "bg-zinc-700 text-zinc-400" },
    streaming: { label: "Running…",  className: "bg-blue-500/20 text-blue-300 animate-pulse" },
    complete:  { label: "Done",      className: "bg-emerald-500/20 text-emerald-300" },
    error:     { label: "Error",     className: "bg-red-500/20 text-red-300" },
  }[status];

  return (
    <Card className={cn(
      "bg-zinc-900 border transition-all duration-300",
      isActive ? "border-blue-500/50 shadow-lg shadow-blue-500/10" : "border-zinc-800",
      status === "complete" && "border-emerald-800/40",
    )}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{stage.icon}</span>
            <span className={cn("font-semibold text-sm", stage.color)}>
              {stage.displayName}
            </span>
            <span className="text-xs text-zinc-500">{stage.model}</span>
          </div>
          <div className="flex items-center gap-2">
            {tokenCount > 0 && (
              <span className="text-[10px] text-zinc-500">{tokenCount.toLocaleString()} tokens</span>
            )}
            <Badge className={cn("text-[10px] px-2 py-0", statusBadge.className)}>
              {statusBadge.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {(output || isActive) && (
        <CardContent className="px-4 pb-3">
          <pre
            ref={scrollRef}
            className={cn(
              "text-[11px] leading-relaxed font-mono overflow-y-auto rounded-md p-3 bg-zinc-950 text-zinc-300 whitespace-pre-wrap break-words",
              status === "complete" ? "max-h-48" : "max-h-64",
            )}
          >
            {output || " "}
            {isActive && <span className="inline-block w-1.5 h-3 bg-blue-400 animate-pulse ml-0.5 align-middle" />}
          </pre>
        </CardContent>
      )}
    </Card>
  );
}
