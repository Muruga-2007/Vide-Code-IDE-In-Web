"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  "python", "typescript", "javascript", "go", "rust",
  "java", "c", "cpp", "bash", "sql",
];

interface Props {
  onSubmit: (prompt: string, language: string) => void;
  isLoading: boolean;
  onReset: () => void;
  hasResult: boolean;
}

export function PromptInput({ onSubmit, isLoading, onReset, hasResult }: Props) {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("python");

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt.trim(), language);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">Prompt</h2>
        <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
          <SelectTrigger className="w-32 h-7 text-xs bg-zinc-900 border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {LANGUAGES.map((l) => (
              <SelectItem key={l} value={l} className="text-xs text-zinc-300 focus:bg-zinc-800">
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        placeholder="Describe what you want to build…&#10;&#10;e.g. Build a REST API with FastAPI that handles user authentication with JWT tokens"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        rows={6}
        className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 text-sm resize-none focus-visible:ring-blue-500/50"
      />

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Running Pipeline…
            </span>
          ) : (
            "Run Pipeline  ⌘↵"
          )}
        </Button>
        {hasResult && (
          <Button
            variant="outline"
            onClick={onReset}
            disabled={isLoading}
            className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
