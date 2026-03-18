"""
Tower stage — generates each file in the manifest concurrently.

Uses smart model routing:
  complexity "high"   → gemini-2.5-flash  (best quality)
  complexity "medium" → gemini-2.5-flash
  complexity "low"    → gemini-2.0-flash  (cheaper/faster)

Files are sorted by type priority before generation so config files
are available as context when core files are generated.
"""

import asyncio
from pathlib import Path

import google.generativeai as genai

from config import settings
from models.config import StageConfig
from models.schemas import FileManifest, FileEntry
from pipeline.prompts import (
    TOWER_SYSTEM_PROMPT,
    build_tower_prompt,
    extract_final_code,
)
from streaming.sse_manager import SSEManager
from token_tracking.tracker import TokenTracker


# Model routing by complexity
_MODEL_MAP = {
    "high":   ("gemini-2.5-flash", 0.4, 4096),
    "medium": ("gemini-2.5-flash", 0.4, 3000),
    "low":    ("gemini-2.0-flash",  0.3, 2048),
}

# File generation priority (lower index = generated first)
_TYPE_PRIORITY = {
    "config": 0,
    "schema": 1,
    "model":  2,
    "util":   3,
    "core":   4,
    "test":   5,
    "docs":   6,
}


def _pick_model(complexity: str) -> tuple[str, float, int]:
    return _MODEL_MAP.get(complexity, _MODEL_MAP["medium"])


def _sort_files(files: list[FileEntry]) -> list[FileEntry]:
    return sorted(files, key=lambda f: _TYPE_PRIORITY.get(f.type, 99))


def _build_related_context(
    file_entry: FileEntry,
    generated: dict[str, str],
    max_chars: int = 6000,
) -> str:
    """
    Build a condensed context string from already-generated files
    that are most relevant to the current file.
    """
    lines: list[str] = []
    total = 0

    # Prefer config/schema files as context
    priority_types = {"config", "schema", "model"}
    candidates = [
        (path, content) for path, content in generated.items()
        if any(pt in path.lower() for pt in priority_types)
    ]
    # Then add any remaining files
    candidates += [
        (path, content) for path, content in generated.items()
        if not any(pt in path.lower() for pt in priority_types)
    ]

    for path, content in candidates:
        if path == file_entry.path:
            continue
        snippet = content[:800]  # first 800 chars of each related file
        entry = f"### {path}\n{snippet}\n{'...' if len(content) > 800 else ''}\n"
        if total + len(entry) > max_chars:
            break
        lines.append(entry)
        total += len(entry)

    return "\n".join(lines)


async def _generate_one_file(
    file_entry: FileEntry,
    manifest: FileManifest,
    generated: dict[str, str],
    session_id: str,
    sse: SSEManager,
    tracker: TokenTracker,
    project_root: str,
) -> tuple[str, str]:
    """Generate a single file and write it to disk. Returns (path, content)."""
    model_name, temperature, max_tokens = _pick_model(file_entry.complexity)

    genai.configure(api_key=settings.GOOGLE_API_KEY)

    stage_key = f"tower_{file_entry.path.replace('/', '_').replace('.', '_')}"

    await sse.emit(session_id, "stage_start", {
        "stage": stage_key,
        "display_name": file_entry.path,
        "model": model_name,
        "file_path": file_entry.path,
    })

    model = genai.GenerativeModel(
        model_name=model_name,
        system_instruction=TOWER_SYSTEM_PROMPT,
        generation_config=genai.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        ),
    )

    related = _build_related_context(file_entry, generated)
    prompt = build_tower_prompt(
        file_entry=file_entry.model_dump(),
        manifest=manifest.model_dump(),
        related_context=related,
    )

    full_output = ""
    token_count = 0

    async def _stream():
        nonlocal full_output, token_count
        response = await model.generate_content_async(prompt, stream=True)
        async for chunk in response:
            try:
                if chunk.text:
                    full_output += chunk.text
                    await sse.emit(session_id, "stage_token", {
                        "stage": stage_key,
                        "token": chunk.text,
                        "file_path": file_entry.path,
                    })
            except (AttributeError, ValueError):
                pass
        token_count = max(int(len(full_output.split()) * 1.3), 1)

    timeout = min(settings.STAGE_TIMEOUT_SEC * 2, 180)
    await asyncio.wait_for(_stream(), timeout=timeout)

    tracker.add(session_id, stage_key, token_count)
    await sse.emit(session_id, "stage_complete", {
        "stage": stage_key,
        "token_count": token_count,
        "file_path": file_entry.path,
    })

    # Extract raw file content (tower prompt asks for no fences, but be safe)
    content = extract_final_code(full_output) if "```" in full_output else full_output.strip()

    # Write to disk
    abs_path = Path(project_root) / file_entry.path
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    abs_path.write_text(content, encoding="utf-8")

    # Notify frontend (include model routing info for vote visualizer)
    await sse.emit(session_id, "file_created", {
        "path": str(abs_path),
        "relative_path": file_entry.path,
        "content": content,
        "model": model_name,
        "complexity": file_entry.complexity,
    })

    return file_entry.path, content


async def run_tower_stage(
    manifest: FileManifest,
    project_root: str,
    session_id: str,
    sse: SSEManager,
    tracker: TokenTracker,
) -> dict[str, str]:
    """
    Generate all files in the manifest concurrently (in batches).
    Returns a dict of { relative_path: content }.
    """
    ordered = _sort_files(manifest.files)
    generated: dict[str, str] = {}
    batch_size = settings.MAX_CONCURRENT_FILES

    for i in range(0, len(ordered), batch_size):
        # Budget guard
        if tracker.total(session_id) >= settings.TOKEN_BUDGET:
            await sse.emit(session_id, "warning", {
                "message": "Token budget reached — remaining files skipped."
            })
            break

        batch = ordered[i:i + batch_size]

        tasks = [
            _generate_one_file(
                file_entry=f,
                manifest=manifest,
                generated=generated,
                session_id=session_id,
                sse=sse,
                tracker=tracker,
                project_root=project_root,
            )
            for f in batch
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for file_entry, result in zip(batch, results):
            if isinstance(result, Exception):
                await sse.emit(session_id, "file_error", {
                    "path": file_entry.path,
                    "error": str(result),
                })
            else:
                path, content = result
                generated[path] = content

    return generated
