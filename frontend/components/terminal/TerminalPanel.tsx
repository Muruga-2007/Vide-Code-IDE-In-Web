"use client";

import { useEffect, useRef } from "react";
import { useTerminal } from "@/hooks/useTerminal";

interface Props {
  isActive: boolean;
}

export function TerminalPanel({ isActive }: Props) {
  const { containerRef, isConnected, connect, disconnect } = useTerminal();
  const hasConnected = useRef(false);

  useEffect(() => {
    if (isActive && !hasConnected.current) {
      hasConnected.current = true;
      connect();
    }
  }, [isActive, connect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="w-full h-full bg-[#09090b] flex flex-col overflow-hidden">
      {!isConnected && !hasConnected.current && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-zinc-500">Connecting...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
