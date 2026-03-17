"use client";

import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Props {
  code: string;
  language: string;
}

export function CodeEditor({ code, language }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm select-none">
        Final code will appear here
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">Result</h2>
        <div className="flex items-center gap-2">
          <Badge className="bg-zinc-800 text-zinc-400 text-[10px]">{language}</Badge>
          <button
            onClick={handleCopy}
            className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
      <div className="flex-1 rounded-lg overflow-hidden border border-zinc-800 min-h-0">
        <MonacoEditor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          value={code}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: "on",
            wordWrap: "on",
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}
