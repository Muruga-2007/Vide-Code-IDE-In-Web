import asyncio
import google.generativeai as genai
from models.config import StageConfig
from streaming.sse_manager import SSEManager
from token_tracking.tracker import TokenTracker


async def run_stage(
    cfg: StageConfig,
    prompt: str,
    session_id: str,
    sse: SSEManager,
    tracker: TokenTracker,
    timeout: int,
    image_parts: list[dict] | None = None,
) -> str:
    """Stream a single pipeline stage and return full text output.

    Args:
        image_parts: Optional list of inline_data dicts for multimodal input.
                     Each dict: {"inline_data": {"mime_type": "...", "data": "<base64>"}}
    """
    model = genai.GenerativeModel(
        model_name=cfg.model,
        system_instruction=_get_system_prompt(cfg.stage),
        generation_config=genai.GenerationConfig(
            temperature=cfg.temperature,
            max_output_tokens=cfg.max_tokens,
        ),
    )

    full_output = ""
    total_tokens = 0

    async def _stream():
        nonlocal full_output, total_tokens

        # Build content — text only or multimodal
        if image_parts:
            contents = [prompt] + image_parts
            response = await model.generate_content_async(contents, stream=True)
        else:
            response = await model.generate_content_async(prompt, stream=True)

        async for chunk in response:
            try:
                if chunk.text:
                    full_output += chunk.text
                    await sse.emit(session_id, "stage_token", {
                        "stage": cfg.stage,
                        "token": chunk.text,
                    })
            except (AttributeError, ValueError):
                # Skip chunks without text content (e.g. during streaming)
                pass

        # Estimate tokens from output length
        total_tokens = max(int(len(full_output.split()) * 1.3), 1)

    await asyncio.wait_for(_stream(), timeout=timeout)

    tracker.add(session_id, cfg.stage, total_tokens)
    await sse.emit(session_id, "stage_complete", {
        "stage": cfg.stage,
        "token_count": total_tokens,
    })

    return full_output


def _get_system_prompt(stage: str) -> str:
    from pipeline.prompts import SYSTEM_PROMPTS
    return SYSTEM_PROMPTS.get(stage, "You are a helpful AI assistant.")
