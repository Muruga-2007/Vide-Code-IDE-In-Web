"use client";

import { useState, useCallback } from "react";
import {
  PipelineState,
  StageName,
  GenerationMode,
  ProjectType,
  FileManifest,
  initialPipelineState,
} from "@/types/pipeline";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface StartPipelineOptions {
  mode?: GenerationMode;
  projectType?: ProjectType;
  images?: Array<{ mime_type: string; data: string }>;
}

export function usePipelineStream(
  onFileCreated?: (path: string, content: string) => void,
  onManifestReady?: (manifest: FileManifest) => void,
) {
  const [state, setState] = useState<PipelineState>(initialPipelineState);

  const startPipeline = useCallback(
    async (prompt: string, language: string, options: StartPipelineOptions = {}) => {
      const mode = options.mode ?? "single_file";

      // Reset state
      setState({
        ...initialPipelineState,
        isStreaming: true,
        language,
        mode,
      });

      // 1. POST to start
      let sessionId: string;
      try {
        const res = await fetch(`${API_URL}/api/pipeline/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            language,
            mode,
            project_type: options.projectType ?? null,
            images: options.images ?? [],
          }),
        });
        if (!res.ok) throw new Error(`Failed to start pipeline: ${res.statusText}`);
        const data = await res.json();
        sessionId = data.session_id;
      } catch (err) {
        setState((prev) => ({ ...prev, isStreaming: false, error: String(err) }));
        return;
      }

      setState((prev) => ({ ...prev, sessionId }));

      // 2. Connect SSE
      const source = new EventSource(`${API_URL}/api/pipeline/${sessionId}/stream`);

      // ── Single-file events ───────────────────────────────────────────────
      source.addEventListener("stage_start", (e) => {
        const { stage } = JSON.parse((e as MessageEvent).data) as { stage: StageName };
        setState((prev) => ({
          ...prev,
          activeStage: stage,
          stageStatuses: { ...prev.stageStatuses, [stage]: "streaming" },
        }));
      });

      source.addEventListener("stage_token", (e) => {
        const { stage, token } = JSON.parse((e as MessageEvent).data) as {
          stage: StageName;
          token: string;
        };
        setState((prev) => {
          if (!(stage in prev.stageOutputs)) return prev;
          return {
            ...prev,
            stageOutputs: {
              ...prev.stageOutputs,
              [stage]: (prev.stageOutputs[stage] ?? "") + token,
            },
          };
        });
      });

      source.addEventListener("stage_complete", (e) => {
        const { stage, token_count } = JSON.parse((e as MessageEvent).data) as {
          stage: StageName;
          token_count: number;
        };
        setState((prev) => {
          if (!(stage in prev.stageStatuses)) return prev;
          return {
            ...prev,
            stageStatuses: { ...prev.stageStatuses, [stage]: "complete" },
            stageTokens: { ...prev.stageTokens, [stage]: token_count },
          };
        });
      });

      source.addEventListener("final_solution", (e) => {
        const { code } = JSON.parse((e as MessageEvent).data) as { code: string };
        setState((prev) => ({ ...prev, finalCode: code, activeStage: null }));
      });

      // ── Multi-file events ────────────────────────────────────────────────
      source.addEventListener("manifest_ready", (e) => {
        const { manifest } = JSON.parse((e as MessageEvent).data) as { manifest: FileManifest };
        setState((prev) => ({ ...prev, manifest }));
        onManifestReady?.(manifest);
      });

      source.addEventListener("file_created", (e) => {
        const { relative_path, content } = JSON.parse((e as MessageEvent).data) as {
          path: string;
          relative_path: string;
          content: string;
        };
        setState((prev) => ({
          ...prev,
          activeFilePath: relative_path,
          generatedFiles: { ...prev.generatedFiles, [relative_path]: content },
        }));
        onFileCreated?.(relative_path, content);
      });

      source.addEventListener("file_updated", (e) => {
        const { relative_path, content } = JSON.parse((e as MessageEvent).data) as {
          path: string;
          relative_path: string;
          content: string;
        };
        setState((prev) => ({
          ...prev,
          generatedFiles: { ...prev.generatedFiles, [relative_path]: content },
        }));
      });

      source.addEventListener("file_error", (e) => {
        const { path: filePath, error } = JSON.parse((e as MessageEvent).data) as {
          path: string;
          error: string;
        };
        setState((prev) => ({
          ...prev,
          errorFiles: { ...prev.errorFiles, [filePath]: error },
        }));
      });

      source.addEventListener("project_complete", (e) => {
        const { project_name, project_path } = JSON.parse((e as MessageEvent).data) as {
          project_name: string;
          project_path: string;
          file_count: number;
        };
        setState((prev) => ({ ...prev, projectName: project_name, projectPath: project_path }));
      });

      // ── Common events ────────────────────────────────────────────────────
      source.addEventListener("token_summary", (e) => {
        const { total } = JSON.parse((e as MessageEvent).data) as { total: number };
        setState((prev) => ({ ...prev, totalTokens: total }));
      });

      source.addEventListener("warning", (e) => {
        const { message } = JSON.parse((e as MessageEvent).data) as { message: string };
        setState((prev) => ({ ...prev, warning: message }));
      });

      source.addEventListener("error", (e) => {
        const data = JSON.parse((e as MessageEvent).data ?? "{}") as { message?: string };
        setState((prev) => ({
          ...prev,
          error: data.message ?? "An unknown error occurred",
        }));
      });

      source.addEventListener("done", () => {
        setState((prev) => ({ ...prev, isStreaming: false, activeStage: null, activeFilePath: null }));
        source.close();
      });

      source.onerror = () => {
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: prev.error ?? "Connection to server lost",
        }));
        source.close();
      };
    },
    [onFileCreated, onManifestReady]
  );

  const reset = useCallback(() => {
    setState(initialPipelineState);
  }, []);

  return { state, startPipeline, reset };
}
