"""
Terminal WebSocket endpoint.

Each connection spawns its own PowerShell process managed by TerminalSession.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from config import settings
from terminal.session import TerminalSession

router = APIRouter()


@router.websocket("/ws/terminal")
async def terminal_ws(websocket: WebSocket):
    await websocket.accept()
    session = TerminalSession(
        websocket=websocket,
        shell=settings.TERMINAL_SHELL,
        shell_args=settings.TERMINAL_SHELL_ARGS,
        cwd=settings.WORKSPACE_ROOT,
    )
    try:
        await session.run()
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
