import uuid
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import PipelineStartRequest, PipelineStartResponse
from pipeline.engine import run_pipeline, get_session_result
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
