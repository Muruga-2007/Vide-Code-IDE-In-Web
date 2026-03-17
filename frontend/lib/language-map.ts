/**
 * Maps file extensions to Monaco Editor language identifiers.
 */
const EXT_TO_LANG: Record<string, string> = {
  ".py":    "python",
  ".ts":    "typescript",
  ".tsx":   "typescript",
  ".js":    "javascript",
  ".jsx":   "javascript",
  ".go":    "go",
  ".rs":    "rust",
  ".java":  "java",
  ".c":     "c",
  ".cpp":   "cpp",
  ".cs":    "csharp",
  ".json":  "json",
  ".md":    "markdown",
  ".mdx":   "markdown",
  ".css":   "css",
  ".scss":  "scss",
  ".html":  "html",
  ".htm":   "html",
  ".xml":   "xml",
  ".yaml":  "yaml",
  ".yml":   "yaml",
  ".toml":  "ini",
  ".sh":    "shell",
  ".bash":  "shell",
  ".zsh":   "shell",
  ".ps1":   "powershell",
  ".sql":   "sql",
  ".tf":    "hcl",
  ".env":   "ini",
  ".ini":   "ini",
  ".conf":  "ini",
  ".txt":   "plaintext",
  ".lock":  "plaintext",
};

export function extToLanguage(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "plaintext";
  const ext = filename.slice(dot).toLowerCase();
  return EXT_TO_LANG[ext] ?? "plaintext";
}
