import asyncio
from pathlib import Path

import google.generativeai as genai

from config import settings
from models.config import PIPELINE_STAGES, StageConfig
from models.schemas import PipelineStartRequest, FileEntry, FileManifest
from pipeline.prompts import (
    build_prompt,
    build_critic_prompt,
    build_optimizer_prompt,
    extract_final_code,
    SYSTEM_PROMPTS,
)
from pipeline.stages.base import run_stage
from pipeline.stages.ground import run_ground_stage
from pipeline.stages.tower import run_tower_stage
from streaming.sse_manager import SSEManager
from token_tracking.tracker import TokenTracker

# Simple in-memory session results store
_session_results: dict[str, dict] = {}

# Pending manifests awaiting user approval (plan_only mode)
_pending_manifests: dict[str, tuple[FileManifest, str, PipelineStartRequest]] = {}


def get_session_result(session_id: str) -> dict | None:
    return _session_results.get(session_id)


async def execute_plan(
    session_id: str,
    manifest: FileManifest,
    original_request: PipelineStartRequest,
    sse: SSEManager,
    tracker: TokenTracker,
):
    """Run Tower+Critic+Optimizer with a (possibly user-edited) manifest."""
    genai.configure(api_key=settings.GOOGLE_API_KEY)
    project_type = (original_request.project_type.value if original_request.project_type else "fullstack")
    project_root = str(Path(settings.WORKSPACE_ROOT) / manifest.project_name)

    import json as _json
    manifest_path = Path(project_root) / "videe_manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(_json.dumps(manifest.model_dump(), indent=2), encoding="utf-8")

    try:
        generated = await run_tower_stage(
            manifest=manifest,
            project_root=project_root,
            session_id=session_id,
            sse=sse,
            tracker=tracker,
        )
        # Run Critic + Optimizer on core files (reuse _run_ground_tower logic)
        _request_stub = PipelineStartRequest(
            prompt=original_request.prompt,
            language=original_request.language,
            mode="multi_file",
            project_type=original_request.project_type,
        )
        # Inline critic/optimizer loop (same as _run_ground_tower)
        core_files = [f for f in manifest.files if f.type == "core"][:3]
        critic_cfg = StageConfig(
            stage="critic",
            model="gemini-2.0-flash",
            temperature=0.1,
            max_tokens=4096,
            display_name="Critic",
            description=SYSTEM_PROMPTS["critic"],
        )
        for file_entry in core_files:
            if tracker.total(session_id) >= settings.TOKEN_BUDGET:
                break
            code = generated.get(file_entry.path, "")
            if not code:
                continue
            critic_prompt = build_critic_prompt(
                file_entry=file_entry.model_dump(),
                code=code,
                project_context=f"{project_type} project using {', '.join(manifest.tech_stack)}",
            )
            try:
                critic_cfg.stage = f"critic_{file_entry.path.replace('/', '_')}"
                await sse.emit(session_id, "stage_start", {
                    "stage": critic_cfg.stage,
                    "display_name": f"Critic: {file_entry.path}",
                    "model": critic_cfg.model,
                })
                corrected_raw = await run_stage(cfg=critic_cfg, prompt=critic_prompt,
                    session_id=session_id, sse=sse, tracker=tracker, timeout=settings.STAGE_TIMEOUT_SEC)
                corrected = extract_final_code(corrected_raw)
                if corrected and corrected != code:
                    generated[file_entry.path] = corrected
                    abs_path = Path(project_root) / file_entry.path
                    abs_path.write_text(corrected, encoding="utf-8")
                    await sse.emit(session_id, "file_updated", {
                        "path": str(abs_path), "relative_path": file_entry.path, "content": corrected,
                    })
            except Exception:
                pass

        optimizer_cfg = StageConfig(
            stage="optimizer", model="gemini-2.0-flash", temperature=0.3,
            max_tokens=4096, display_name="Optimizer", description=SYSTEM_PROMPTS["optimizer"],
        )
        for file_entry in core_files:
            if tracker.total(session_id) >= settings.TOKEN_BUDGET:
                break
            code = generated.get(file_entry.path, "")
            if not code:
                continue
            opt_prompt = build_optimizer_prompt(file_entry=file_entry.model_dump(), code=code)
            try:
                optimizer_cfg.stage = f"optimizer_{file_entry.path.replace('/', '_')}"
                await sse.emit(session_id, "stage_start", {
                    "stage": optimizer_cfg.stage,
                    "display_name": f"Optimizer: {file_entry.path}",
                    "model": optimizer_cfg.model,
                })
                optimized_raw = await run_stage(cfg=optimizer_cfg, prompt=opt_prompt,
                    session_id=session_id, sse=sse, tracker=tracker, timeout=settings.STAGE_TIMEOUT_SEC)
                optimized = extract_final_code(optimized_raw) if "```" in optimized_raw else optimized_raw.strip()
                if optimized and optimized != code:
                    generated[file_entry.path] = optimized
                    abs_path = Path(project_root) / file_entry.path
                    abs_path.write_text(optimized, encoding="utf-8")
                    await sse.emit(session_id, "file_updated", {
                        "path": str(abs_path), "relative_path": file_entry.path, "content": optimized,
                    })
            except Exception:
                pass

        summary = tracker.summary(session_id)
        _session_results[session_id] = {
            "session_id": session_id, "mode": "multi_file",
            "project_name": manifest.project_name, "project_path": project_root,
            "file_count": len(generated), "token_summary": summary,
        }
        await sse.emit(session_id, "project_complete", {
            "project_name": manifest.project_name, "project_path": project_root,
            "file_count": len(generated), "token_summary": summary,
        })
        await sse.emit(session_id, "token_summary", summary)
        await sse.emit(session_id, "done", {})
    except Exception as e:
        await sse.emit(session_id, "error", {"message": str(e)})
        await sse.emit(session_id, "done", {})
    finally:
        sse.cleanup(session_id)
        tracker.cleanup(session_id)
        _pending_manifests.pop(session_id, None)


# ─── Dispatcher ───────────────────────────────────────────────────────────────

async def run_pipeline(
    session_id: str,
    request: PipelineStartRequest,
    sse: SSEManager,
    tracker: TokenTracker,
):
    """Dispatcher — routes to single-file or ground-tower pipeline."""
    genai.configure(api_key=settings.GOOGLE_API_KEY)

    try:
        if request.mode == "multi_file":
            await _run_ground_tower(session_id, request, sse, tracker)
        else:
            await _run_single_file(session_id, request, sse, tracker)
    except Exception as e:
        await sse.emit(session_id, "error", {"message": str(e)})
        await sse.emit(session_id, "done", {})
    finally:
        sse.cleanup(session_id)
        tracker.cleanup(session_id)


# ─── Single-file Pipeline (original behaviour) ────────────────────────────────

async def _run_single_file(
    session_id: str,
    request: PipelineStartRequest,
    sse: SSEManager,
    tracker: TokenTracker,
):
    context: dict = {
        "original_prompt": request.prompt,
        "language": request.language,
        "context": request.context,
    }
    stage_results = []

    # Build image parts for multimodal if images were uploaded
    image_parts = [
        {"inline_data": {"mime_type": img.mime_type, "data": img.data}}
        for img in request.images
    ] if request.images else None

    try:
        for cfg in PIPELINE_STAGES:
            if tracker.total(session_id) >= settings.TOKEN_BUDGET:
                await sse.emit(session_id, "warning", {
                    "message": f"Token budget of {settings.TOKEN_BUDGET} reached. Stopping early.",
                })
                break

            await sse.emit(session_id, "stage_start", {
                "stage": cfg.stage,
                "display_name": cfg.display_name,
                "model": cfg.model,
            })

            prompt = build_prompt(cfg.stage, context, request.language)

            # Only pass images to the first stage (planner)
            stage_images = image_parts if cfg.stage == "planner" else None

            try:
                output = await run_stage(
                    cfg=cfg,
                    prompt=prompt,
                    session_id=session_id,
                    sse=sse,
                    tracker=tracker,
                    timeout=settings.STAGE_TIMEOUT_SEC,
                    image_parts=stage_images,
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


# ─── Ground-Tower Pipeline ────────────────────────────────────────────────────

async def _run_ground_tower(
    session_id: str,
    request: PipelineStartRequest,
    sse: SSEManager,
    tracker: TokenTracker,
):
    project_type = (request.project_type.value if request.project_type else "fullstack")

    # ── GROUND: Planner generates file manifest ──────────────────────────────
    try:
        manifest = await run_ground_stage(
            user_request=request.prompt,
            project_type=project_type,
            session_id=session_id,
            sse=sse,
            tracker=tracker,
            images=request.images or None,
            project_root=None,  # will be set after we know project_name
        )
    except (asyncio.TimeoutError, ValueError) as e:
        await sse.emit(session_id, "error", {"message": f"Ground phase failed: {e}"})
        await sse.emit(session_id, "done", {})
        return

    project_root = str(Path(settings.WORKSPACE_ROOT) / manifest.project_name)

    # Persist manifest now that we know the project root
    manifest_path = Path(project_root) / "videe_manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    import json
    manifest_path.write_text(json.dumps(manifest.model_dump(), indent=2), encoding="utf-8")

    # ── PLAN ONLY: Stop here, wait for user approval ──────────────────────────
    if request.plan_only:
        _pending_manifests[session_id] = (manifest, project_root, request)
        await sse.emit(session_id, "plan_ready", {
            "manifest": manifest.model_dump(),
            "project_root": project_root,
        })
        # Do NOT emit "done" — the SSE stream stays open waiting for /execute
        return

    # ── TOWER: Generate all files concurrently ────────────────────────────────
    generated = await run_tower_stage(
        manifest=manifest,
        project_root=project_root,
        session_id=session_id,
        sse=sse,
        tracker=tracker,
    )

    # ── CRITIC: Review core files ─────────────────────────────────────────────
    core_files = [f for f in manifest.files if f.type == "core"][:3]

    critic_cfg = StageConfig(
        stage="critic",
        model="gemini-2.0-flash",
        temperature=0.1,
        max_tokens=4096,
        display_name="Critic",
        description=SYSTEM_PROMPTS["critic"],
    )

    for file_entry in core_files:
        if tracker.total(session_id) >= settings.TOKEN_BUDGET:
            await sse.emit(session_id, "warning", {"message": "Token budget reached — skipping critic."})
            break

        code = generated.get(file_entry.path, "")
        if not code:
            continue

        critic_prompt = build_critic_prompt(
            file_entry=file_entry.model_dump(),
            code=code,
            project_context=f"{project_type} project using {', '.join(manifest.tech_stack)}",
        )

        try:
            critic_cfg.stage = f"critic_{file_entry.path.replace('/', '_')}"
            await sse.emit(session_id, "stage_start", {
                "stage": critic_cfg.stage,
                "display_name": f"Critic: {file_entry.path}",
                "model": critic_cfg.model,
                "file_path": file_entry.path,
            })
            corrected_raw = await run_stage(
                cfg=critic_cfg,
                prompt=critic_prompt,
                session_id=session_id,
                sse=sse,
                tracker=tracker,
                timeout=settings.STAGE_TIMEOUT_SEC,
            )
            corrected = extract_final_code(corrected_raw)
            if corrected and corrected != code:
                generated[file_entry.path] = corrected
                abs_path = Path(project_root) / file_entry.path
                abs_path.write_text(corrected, encoding="utf-8")
                await sse.emit(session_id, "file_updated", {
                    "path": str(abs_path),
                    "relative_path": file_entry.path,
                    "content": corrected,
                })
        except Exception:
            pass  # Critic failure is non-fatal

    # ── OPTIMIZER: Polish core files ──────────────────────────────────────────
    optimizer_cfg = StageConfig(
        stage="optimizer",
        model="gemini-2.0-flash",
        temperature=0.3,
        max_tokens=4096,
        display_name="Optimizer",
        description=SYSTEM_PROMPTS["optimizer"],
    )

    for file_entry in core_files:
        if tracker.total(session_id) >= settings.TOKEN_BUDGET:
            break

        code = generated.get(file_entry.path, "")
        if not code:
            continue

        opt_prompt = build_optimizer_prompt(file_entry=file_entry.model_dump(), code=code)

        try:
            optimizer_cfg.stage = f"optimizer_{file_entry.path.replace('/', '_')}"
            await sse.emit(session_id, "stage_start", {
                "stage": optimizer_cfg.stage,
                "display_name": f"Optimizer: {file_entry.path}",
                "model": optimizer_cfg.model,
                "file_path": file_entry.path,
            })
            optimized_raw = await run_stage(
                cfg=optimizer_cfg,
                prompt=opt_prompt,
                session_id=session_id,
                sse=sse,
                tracker=tracker,
                timeout=settings.STAGE_TIMEOUT_SEC,
            )
            optimized = extract_final_code(optimized_raw) if "```" in optimized_raw else optimized_raw.strip()
            if optimized and optimized != code:
                generated[file_entry.path] = optimized
                abs_path = Path(project_root) / file_entry.path
                abs_path.write_text(optimized, encoding="utf-8")
                await sse.emit(session_id, "file_updated", {
                    "path": str(abs_path),
                    "relative_path": file_entry.path,
                    "content": optimized,
                })
        except Exception:
            pass  # Optimizer failure is non-fatal

    # ── FINALIZE ─────────────────────────────────────────────────────────────
    summary = tracker.summary(session_id)

    _session_results[session_id] = {
        "session_id": session_id,
        "mode": "multi_file",
        "project_name": manifest.project_name,
        "project_path": project_root,
        "file_count": len(generated),
        "token_summary": summary,
    }

    await sse.emit(session_id, "project_complete", {
        "project_name": manifest.project_name,
        "project_path": project_root,
        "file_count": len(generated),
        "token_summary": summary,
    })
    await sse.emit(session_id, "token_summary", summary)
    await sse.emit(session_id, "done", {})
