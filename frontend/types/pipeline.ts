export type StageName = "planner" | "coder" | "critic" | "optimizer";

export type StageStatus = "pending" | "streaming" | "complete" | "error";

export type ProjectType = "frontend" | "backend" | "fullstack" | "micro_saas";

export type GenerationMode = "single_file" | "multi_file";

export interface StageInfo {
  name: StageName;
  displayName: string;
  model: string;
  color: string;
  icon: string;
}

export const STAGES: StageInfo[] = [
  { name: "planner",   displayName: "Planner",   model: "gemini-2.5-pro",   color: "text-violet-400",  icon: "🧠" },
  { name: "coder",     displayName: "Coder",     model: "gemini-2.5-flash", color: "text-blue-400",    icon: "⚡" },
  { name: "critic",    displayName: "Critic",    model: "gemini-2.5-flash", color: "text-amber-400",   icon: "🔍" },
  { name: "optimizer", displayName: "Optimizer", model: "gemini-2.0-flash", color: "text-emerald-400", icon: "✨" },
];

// ─── Multi-file types ────────────────────────────────────────────────────────

export interface FileEntry {
  path: string;
  type: string;
  description: string;
  complexity: "high" | "medium" | "low";
}

export interface FileManifest {
  project_name: string;
  description: string;
  tech_stack: string[];
  files: FileEntry[];
}

// ─── Pipeline state ───────────────────────────────────────────────────────────

export interface PipelineState {
  sessionId: string | null;
  isStreaming: boolean;
  mode: GenerationMode;
  activeStage: string | null;
  stageStatuses: Record<StageName, StageStatus>;
  stageOutputs: Record<StageName, string>;
  stageTokens: Record<StageName, number>;
  finalCode: string | null;
  language: string;
  totalTokens: number;
  error: string | null;
  warning: string | null;
  // Multi-file mode
  manifest: FileManifest | null;
  generatedFiles: Record<string, string>;   // relative_path → content
  activeFilePath: string | null;
  errorFiles: Record<string, string>;       // relative_path → error message
  projectPath: string | null;
  projectName: string | null;
}

export const initialPipelineState: PipelineState = {
  sessionId: null,
  isStreaming: false,
  mode: "single_file",
  activeStage: null,
  stageStatuses: { planner: "pending", coder: "pending", critic: "pending", optimizer: "pending" },
  stageOutputs:  { planner: "", coder: "", critic: "", optimizer: "" },
  stageTokens:   { planner: 0,  coder: 0,  critic: 0,  optimizer: 0  },
  finalCode: null,
  language: "python",
  totalTokens: 0,
  error: null,
  warning: null,
  manifest: null,
  generatedFiles: {},
  activeFilePath: null,
  errorFiles: {},
  projectPath: null,
  projectName: null,
};
