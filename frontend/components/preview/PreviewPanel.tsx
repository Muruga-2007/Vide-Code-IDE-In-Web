"use client";

import { useState, useRef } from "react";
import { RefreshCw, ExternalLink, Monitor, X } from "lucide-react";

interface Props {
  defaultPort?: number;
}

export function PreviewPanel({ defaultPort = 3001 }: Props) {
  const [port, setPort] = useState(defaultPort);
  const [inputPort, setInputPort] = useState(String(defaultPort));
  const [url, setUrl] = useState(`http://localhost:${defaultPort}`);
  const [inputUrl, setInputUrl] = useState(`http://localhost:${defaultPort}`);
  const [key, setKey] = useState(0); // force iframe reload
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const applyUrl = (target: string) => {
    setUrl(target);
    setKey((k) => k + 1);
    setError(false);
  };

  const handlePortSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputPort, 10);
    if (!isNaN(p) && p > 0 && p < 65536) {
      setPort(p);
      const next = `http://localhost:${p}`;
      setInputUrl(next);
      applyUrl(next);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyUrl(inputUrl);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 shrink-0 bg-zinc-900">
        {/* Port quick-set */}
        <form onSubmit={handlePortSubmit} className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-500 shrink-0">Port</span>
          <input
            type="number"
            value={inputPort}
            onChange={(e) => setInputPort(e.target.value)}
            className="w-16 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            min={1}
            max={65535}
          />
        </form>

        <span className="text-zinc-700 text-xs">|</span>

        {/* URL bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center gap-1">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
            placeholder="http://localhost:3000"
          />
        </form>

        {/* Actions */}
        <button
          onClick={() => { setKey((k) => k + 1); setError(false); }}
          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={13} />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Preview frame */}
      <div className="flex-1 relative bg-white">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 bg-zinc-950 text-zinc-500">
            <Monitor size={32} className="text-zinc-700" />
            <p className="text-sm">Could not load preview</p>
            <p className="text-xs text-zinc-600">Make sure your dev server is running at</p>
            <code className="text-xs text-blue-400 bg-zinc-900 px-2 py-1 rounded">{url}</code>
            <button
              onClick={() => { setKey((k) => k + 1); setError(false); }}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
            >
              <RefreshCw size={11} />
              Retry
            </button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={key}
            src={url}
            className="w-full h-full border-none"
            title="Preview"
            onError={() => setError(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        )}
      </div>
    </div>
  );
}
