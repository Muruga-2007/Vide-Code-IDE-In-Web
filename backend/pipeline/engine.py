import asyncio
import google.generativeai as genai

from config import settings
from models.config import PIPELINE_STAGES
from models.schemas import PipelineStartRequest
from pipeline.prompts import build_prompt, extract_final_code
from pipeline.stages.base import run_stage
from streaming.sse_manager import SSEManager
from token_tracking.tracker import TokenTracker

# Simple in-memory session results store
_session_results: dict[str, dict] = {}


def get_session_result(session_id: str) -> dict | None:
    return _session_results.get(session_id)


async def run_pipeline(
    session_id: str,
    request: PipelineStartRequest,
    sse: SSEManager,
    tracker: TokenTracker,
):
    genai.configure(api_key=settings.GOOGLE_API_KEY)

    context: dict = {
        "original_prompt": request.prompt,
        "language": request.language,
        "context": request.context,
    }
    stage_results = []

    try:
        for cfg in PIPELINE_STAGES:
            # Budget check before each stage
            if tracker.total(session_id) >= settings.TOKEN_BUDGET:
                await sse.emit(session_id, "warning", {
                    "message": f"Token budget of {settings.TOKEN_BUDGET} reached. Stopping pipeline early.",
                })
                break

            await sse.emit(session_id, "stage_start", {
                "stage": cfg.stage,
                "display_name": cfg.display_name,
                "model": cfg.model,
            })

            prompt = build_prompt(cfg.stage, context, request.language)

            try:
                output = await run_stage(
                    cfg=cfg,
                    prompt=prompt,
                    session_id=session_id,
                    sse=sse,
                    tracker=tracker,
                    timeout=settings.STAGE_TIMEOUT_SEC,
                )
            except asyncio.TimeoutError:
                await sse.emit(session_id, "error", {
                    "message": f"Stage '{cfg.stage}' timed out after {settings.STAGE_TIMEOUT_SEC}s",
                })
                break

            context[f"{cfg.stage}_output"] = output
            stage_results.append({
                "stage": cfg.stage,
                "output": output,
                "token_count": tracker._data[session_id].get(cfg.stage, 0),
            })

        # Determine final code — use best available stage output
        final_raw = (
            context.get("optimizer_output")
            or context.get("critic_output")
            or context.get("coder_output")
            or context.get("planner_output")
            or ""
        )
        final_code = extract_final_code(final_raw)

        summary = tracker.summary(session_id)

        _session_results[session_id] = {
            "session_id": session_id,
            "stages": stage_results,
            "final_code": final_code,
            "language": request.language,
            "token_summary": summary,
        }

        await sse.emit(session_id, "final_solution", {
            "code": final_code,
            "language": request.language,
        })
        await sse.emit(session_id, "token_summary", summary)
        await sse.emit(session_id, "done", {})

    except Exception as e:
        await sse.emit(session_id, "error", {"message": str(e)})
        await sse.emit(session_id, "done", {})
    finally:
        sse.cleanup(session_id)
        tracker.cleanup(session_id)
