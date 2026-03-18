import uuid
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import PipelineStartRequest, PipelineStartResponse, ExecutePlanRequest
from pipeline.engine import run_pipeline, get_session_result, execute_plan, _pending_manifests
from streaming.sse_manager import sse_manager
from token_tracking.tracker import token_tracker

router = APIRouter()


@router.post("/start", response_model=PipelineStartResponse)
async def start_pipeline(request: PipelineStartRequest, background_tasks: BackgroundTasks):
    session_id = str(uuid.uuid4())
    background_tasks.add_task(run_pipeline, session_id, request, sse_manager, token_tracker)
    return PipelineStartResponse(session_id=session_id)


@router.get("/{session_id}/stream")
async def stream_pipeline(session_id: str):
    return StreamingResponse(
        sse_manager.stream(session_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/{session_id}/result")
async def get_result(session_id: str):
    result = get_session_result(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found or still in progress")
    return result


@router.post("/{session_id}/execute")
async def execute_approved_plan(
    session_id: str,
    request: ExecutePlanRequest,
    background_tasks: BackgroundTasks,
):
    """Execute Tower+Critic+Optimizer with the (possibly user-edited) manifest."""
    pending = _pending_manifests.get(session_id)
    if not pending:
        raise HTTPException(status_code=404, detail="No pending plan for this session")
    _original_manifest, _project_root, original_request = pending

    background_tasks.add_task(
        execute_plan,
        session_id,
        request.manifest,
        original_request,
        sse_manager,
        token_tracker,
    )
    return {"ok": True, "session_id": session_id}
