"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Terminal } from "@xterm/xterm";
import type { FitAddon } from "@xterm/addon-fit";
import { TerminalMessage } from "@/types/terminal";

const WS_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
  .replace(/^http/, "ws");

export function useTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Dynamically import xterm (client-only)
    const { Terminal } = await import("@xterm/xterm");
    const { FitAddon } = await import("@xterm/addon-fit");
    await import("@xterm/xterm/css/xterm.css");

    if (!containerRef.current) return;

    // Create terminal instance
    const term = new Terminal({
      theme: {
        background: "#09090b",   // zinc-950
        foreground: "#f4f4f5",   // zinc-100
        cursor: "#3b82f6",       // blue-500
        selectionBackground: "#3f3f46",
      },
      fontFamily: "var(--font-geist-mono), 'Cascadia Code', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    // WebSocket connection
    const ws = new WebSocket(`${WS_URL}/ws/terminal`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const msg: TerminalMessage = JSON.parse(event.data);
      if (msg.type === "output" && msg.data) {
        term.write(atob(msg.data));
      } else if (msg.type === "ready") {
        term.writeln(`\x1b[32mConnected — cwd: ${msg.cwd}\x1b[0m\r`);
      } else if (msg.type === "exit") {
        term.writeln(`\r\n\x1b[33mProcess exited (code ${msg.code})\x1b[0m`);
        setIsConnected(false);
      } else if (msg.type === "error") {
        term.writeln(`\r\n\x1b[31mError: ${msg.message}\x1b[0m`);
      }
    };

    ws.onclose = () => setIsConnected(false);
    ws.onerror  = () => setIsConnected(false);

    // Forward keystrokes to server
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    // Resize observer
    const observer = new ResizeObserver(() => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "resize",
          cols: term.cols,
          rows: term.rows,
        }));
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    termRef.current?.dispose();
    termRef.current = null;
    fitRef.current = null;
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  // Auto-fit on window resize
  useEffect(() => {
    const handler = () => fitRef.current?.fit();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return { containerRef, isConnected, connect, disconnect };
}
