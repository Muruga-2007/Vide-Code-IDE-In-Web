"""
Ground stage — runs the Planner model to produce a FileManifest JSON.

This is the first phase of the Ground-Tower architecture.
"""

import asyncio
import json
from pathlib import Path

import google.generativeai as genai

from config import settings
from models.config import StageConfig
from models.schemas import FileManifest, ImagePart
from pipeline.prompts import (
    GROUND_SYSTEM_PROMPT,
    build_ground_prompt,
    extract_json_from_text,
)
from streaming.sse_manager import SSEManager
from token_tracking.tracker import TokenTracker


GROUND_CFG = StageConfig(
    stage="ground_planner",
    model="gemini-2.5-pro",
    temperature=0.2,
    max_tokens=4096,
    display_name="Ground Planner",
    description=GROUND_SYSTEM_PROMPT,
)


async def run_ground_stage(
    user_request: str,
    project_type: str,
    session_id: str,
    sse: SSEManager,
    tracker: TokenTracker,
    images: list[ImagePart] | None = None,
    project_root: str | None = None,
) -> FileManifest:
    """
    Stream the Planner model to produce a FileManifest.
    Emits stage_start, stage_token, stage_complete, then manifest_ready.
    Raises ValueError if JSON cannot be parsed.
    """
    genai.configure(api_key=settings.GOOGLE_API_KEY)

    await sse.emit(session_id, "stage_start", {
        "stage": "ground_planner",
        "display_name": "Ground Planner",
        "model": GROUND_CFG.model,
    })

    model = genai.GenerativeModel(
        model_name=GROUND_CFG.model,
        system_instruction=GROUND_SYSTEM_PROMPT,
        generation_config=genai.GenerationConfig(
            temperature=GROUND_CFG.temperature,
            max_output_tokens=GROUND_CFG.max_tokens,
        ),
    )

    prompt = build_ground_prompt(user_request, project_type)

    # Build content parts — text + optional images
    parts: list = [prompt]
    if images:
        for img in images:
            parts.append({
                "inline_data": {
                    "mime_type": img.mime_type,
                    "data": img.data,
                }
            })

    full_output = ""
    token_count = 0

    async def _stream():
        nonlocal full_output, token_count
        if images:
            response = await model.generate_content_async(parts, stream=True)
        else:
            response = await model.generate_content_async(prompt, stream=True)

        async for chunk in response:
            try:
                if chunk.text:
                    full_output += chunk.text
                    await sse.emit(session_id, "stage_token", {
                        "stage": "ground_planner",
                        "token": chunk.text,
                    })
            except (AttributeError, ValueError):
                pass

        token_count = max(int(len(full_output.split()) * 1.3), 1)

    await asyncio.wait_for(_stream(), timeout=settings.STAGE_TIMEOUT_SEC)

    tracker.add(session_id, "ground_planner", token_count)
    await sse.emit(session_id, "stage_complete", {
        "stage": "ground_planner",
        "token_count": token_count,
    })

    # Parse JSON from the streamed output
    json_text = extract_json_from_text(full_output)
    try:
        raw = json.loads(json_text)
        manifest = FileManifest(**raw)
    except (json.JSONDecodeError, Exception) as e:
        raise ValueError(f"Planner did not return valid JSON manifest: {e}\n\nRaw output:\n{full_output[:500]}")

    # Enforce file count limit
    if len(manifest.files) > settings.MAX_FILES_PER_PROJECT:
        manifest.files = manifest.files[:settings.MAX_FILES_PER_PROJECT]

    # Emit manifest_ready so frontend can show the file checklist immediately
    await sse.emit(session_id, "manifest_ready", {"manifest": manifest.model_dump()})

    # Persist manifest to disk
    if project_root:
        manifest_path = Path(project_root) / "videe_manifest.json"
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(
            json.dumps(manifest.model_dump(), indent=2),
            encoding="utf-8",
        )

    return manifest
