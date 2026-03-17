"""
All system prompts and user-prompt builders for every pipeline mode.
"""

import re

# ─── Single-file Pipeline Prompts ─────────────────────────────────────────────

SYSTEM_PROMPTS = {
    "planner": (
        "You are a senior software architect. Your job is to analyze a coding task and produce "
        "a clear, numbered implementation plan with pseudocode. Be concise. Do not write actual code — "
        "only steps and pseudocode. Focus on structure, edge cases to handle, and key design decisions."
    ),
    "coder": (
        "You are an expert software engineer. You will receive a coding task and an implementation plan. "
        "Write complete, working code that follows the plan exactly. "
        "Wrap your code in a single fenced code block. Include only the code — no explanations outside the block."
    ),
    "critic": (
        "You are a rigorous code reviewer specializing in correctness, security, and edge cases. "
        "You will receive code to review. Identify ALL bugs, edge cases, security issues, and bad practices. "
        "Then produce a corrected version of the full code. "
        "Format your response as:\n"
        "## Issues Found\n- <list issues>\n\n## Corrected Code\n```<language>\n<full corrected code>\n```"
    ),
    "optimizer": (
        "You are a code optimization specialist. You will receive code to polish. "
        "Improve readability, remove redundancy, apply idiomatic patterns, and ensure consistent style. "
        "Do NOT change functionality. Output only the final polished code in a fenced code block — no explanations."
    ),
}


# ─── Ground-Tower: Project Type Context ───────────────────────────────────────

PROJECT_TYPE_CONTEXT = {
    "frontend": (
        "Tech stack: React + TypeScript + Tailwind CSS + Vite. "
        "Structure: src/components/, src/pages/, src/hooks/, src/lib/, src/types/. "
        "Best practices: functional components, custom hooks, proper TypeScript types, responsive design."
    ),
    "backend": (
        "Tech stack: Python + FastAPI + Pydantic + SQLAlchemy (SQLite default). "
        "Structure: main.py, models/, routes/, schemas/, services/, database.py. "
        "Best practices: async endpoints, proper error handling, input validation, env-based config."
    ),
    "fullstack": (
        "Tech stack: Next.js 15 (App Router) + TypeScript + Tailwind CSS (frontend) + "
        "FastAPI + Python (backend). "
        "Structure: frontend/ (Next.js), backend/ (FastAPI). "
        "Best practices: API client in frontend/lib/api.ts, CORS config, env variables for API URL."
    ),
    "micro_saas": (
        "Tech stack: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui (frontend) + "
        "FastAPI + Python + SQLAlchemy (backend). "
        "Core features: auth (JWT), billing placeholder, dashboard, REST API, database models. "
        "Structure: frontend/ (Next.js), backend/ (FastAPI with auth/billing/dashboard modules). "
        "Best practices: protected routes, middleware auth, role-based access, comprehensive README."
    ),
}

# ─── Ground Phase: File Manifest System Prompt ────────────────────────────────

GROUND_SYSTEM_PROMPT = """You are a senior software architect generating a complete project file manifest.

Your ONLY output must be a valid JSON object (no markdown fences, no explanations before or after).

The JSON must match this exact schema:
{
  "project_name": "my-project-name",
  "description": "One sentence describing the project",
  "tech_stack": ["list", "of", "technologies"],
  "files": [
    {
      "path": "relative/path/to/file.py",
      "type": "core|config|schema|util|test|docs",
      "description": "What this file does in one sentence",
      "complexity": "high|medium|low"
    }
  ]
}

File type definitions:
- core: Main application logic (app.py, index.ts, main components)
- config: Configuration files (requirements.txt, package.json, .env.example, README.md)
- schema: Data models, types, interfaces
- util: Helper utilities, constants, middleware
- test: Test files
- docs: Documentation

Complexity:
- high: Core business logic, complex components, main entry points
- medium: Standard CRUD, typical components
- low: Config files, simple utilities, boilerplate

Rules:
- Keep files <= 30 (respect the project size limit)
- Make the file list COMPLETE and PRODUCTION-READY
- Use realistic, idiomatic file paths for the chosen stack
- project_name must be snake_case, lowercase, no spaces
- Output RAW JSON ONLY — no code fences, no explanation text"""


# ─── Tower Phase: Per-File Coder System Prompt ────────────────────────────────

TOWER_SYSTEM_PROMPT = """You are an expert software engineer writing a single file of a larger project.

Rules:
- Write COMPLETE, working code for this specific file
- Follow the tech stack and project structure described in the context
- Output ONLY the file content — no explanations, no markdown fences, no "Here is the code:"
- The output is written directly to disk as-is
- Make the code production-quality: proper error handling, types, and idiomatic style
- Use relative imports consistent with the project structure"""


# ─── Critic / Optimizer Prompt Builders ──────────────────────────────────────

def build_critic_prompt(file_entry: dict, code: str, project_context: str) -> str:
    return (
        f"Review this {file_entry['path']} file from a {project_context} project.\n\n"
        f"## File Description\n{file_entry['description']}\n\n"
        f"## Code\n```\n{code}\n```\n\n"
        "Find ALL bugs, security issues, missing error handling, and bad practices. "
        "Then output the complete corrected file.\n\n"
        "Format:\n## Issues\n- <issue>\n\n## Fixed Code\n```\n<full corrected code>\n```"
    )


def build_optimizer_prompt(file_entry: dict, code: str) -> str:
    return (
        f"Polish this {file_entry['path']} file for production.\n\n"
        f"Improve readability, remove redundancy, apply idiomatic patterns. "
        f"Do NOT change functionality.\n\n"
        f"Output ONLY the final polished code — no fences, no explanations:\n\n{code}"
    )


# ─── Single-file Pipeline Prompt Builders ────────────────────────────────────

def build_prompt(stage: str, context: dict, language: str) -> str:
    prompt = context["original_prompt"]
    lang = language

    if stage == "planner":
        extra = f"\n\nAdditional context:\n{context['context']}" if context.get("context") else ""
        return (
            f"Create an implementation plan for the following coding task in {lang}:\n\n"
            f"{prompt}{extra}"
        )

    if stage == "coder":
        plan = context.get("planner_output", "No plan available.")
        return (
            f"Implement the following coding task in {lang}.\n\n"
            f"## Task\n{prompt}\n\n"
            f"## Implementation Plan\n{plan}\n\n"
            f"Write the complete implementation."
        )

    if stage == "critic":
        code = _extract_code(context.get("coder_output", ""))
        return (
            f"Review the following {lang} code written for this task:\n\n"
            f"## Task\n{prompt}\n\n"
            f"## Code to Review\n```{lang}\n{code}\n```"
        )

    if stage == "optimizer":
        code = _extract_code(context.get("critic_output", context.get("coder_output", "")))
        return (
            f"Optimize and polish the following {lang} code:\n\n"
            f"```{lang}\n{code}\n```"
        )

    return prompt


# ─── Ground Prompt Builder ────────────────────────────────────────────────────

def build_ground_prompt(user_request: str, project_type: str) -> str:
    type_context = PROJECT_TYPE_CONTEXT.get(project_type, "")
    return (
        f"Generate a complete file manifest for this project:\n\n"
        f"## Request\n{user_request}\n\n"
        f"## Tech Stack Guidance\n{type_context}\n\n"
        f"Output the JSON manifest now."
    )


# ─── Tower Prompt Builder ─────────────────────────────────────────────────────

def build_tower_prompt(
    file_entry: dict,
    manifest: dict,
    related_context: str,
) -> str:
    type_key = _detect_project_type(manifest.get("tech_stack", []))
    stack_context = PROJECT_TYPE_CONTEXT.get(type_key, "")

    prompt = (
        f"Project: {manifest['project_name']}\n"
        f"Description: {manifest['description']}\n"
        f"Tech Stack: {', '.join(manifest.get('tech_stack', []))}\n"
        f"{stack_context}\n\n"
        f"## File to Write\n"
        f"Path: {file_entry['path']}\n"
        f"Type: {file_entry['type']}\n"
        f"Purpose: {file_entry['description']}\n\n"
    )

    if related_context:
        prompt += f"## Related Files Already Generated\n{related_context}\n\n"

    prompt += "Write the complete content of this file:"
    return prompt


def _detect_project_type(tech_stack: list[str]) -> str:
    stack_lower = " ".join(tech_stack).lower()
    if "next" in stack_lower or "react" in stack_lower:
        if "fastapi" in stack_lower or "django" in stack_lower:
            return "fullstack"
        return "frontend"
    if "fastapi" in stack_lower or "django" in stack_lower or "flask" in stack_lower:
        return "backend"
    return "fullstack"


# ─── Code / JSON Extraction ───────────────────────────────────────────────────

def _extract_code(text: str) -> str:
    """Pull code from a fenced block if present, else return raw text."""
    pattern = r"```(?:\w+)?\n([\s\S]*?)```"
    matches = re.findall(pattern, text)
    if matches:
        return max(matches, key=len).strip()
    return text.strip()


def extract_final_code(text: str) -> str:
    """Public helper used by pipeline engine."""
    return _extract_code(text)


def extract_json_from_text(text: str) -> str:
    """Extract a JSON object from text that may contain prose around it."""
    # Try to find ```json ... ``` block first
    json_fence = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
    if json_fence:
        return json_fence.group(1).strip()
    # Otherwise find the first { ... } span
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1].strip()
    return text.strip()
