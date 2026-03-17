"""
TerminalSession — manages a single PowerShell subprocess over a WebSocket.

Protocol (JSON messages):
  Client → Server:
    { "type": "input",  "data": "npm install\\r" }
    { "type": "resize", "cols": 220, "rows": 50 }
    { "type": "ping" }

  Server → Client:
    { "type": "ready",  "session_id": "uuid", "cwd": "..." }
    { "type": "output", "data": "<base64-encoded stdout/stderr>" }
    { "type": "exit",   "code": 0 }
    { "type": "pong" }
    { "type": "error",  "message": "..." }

Output bytes are base64-encoded so ANSI escape sequences survive JSON.
"""

import asyncio
import base64
import json
import uuid
from pathlib import Path

from fastapi import WebSocket, WebSocketDisconnect


class TerminalSession:
    def __init__(
        self,
        websocket: WebSocket,
        shell: str,
        shell_args: list[str],
        cwd: str,
    ):
        self.session_id = str(uuid.uuid4())
        self.ws = websocket
        self.shell = shell
        self.shell_args = shell_args
        self.cwd = cwd
        self._process: asyncio.subprocess.Process | None = None
        self._read_task: asyncio.Task | None = None
        self._write_task: asyncio.Task | None = None

    async def run(self):
        """Spawn the shell, start I/O tasks, and wait until disconnect."""
        # Ensure cwd exists
        Path(self.cwd).mkdir(parents=True, exist_ok=True)

        try:
            self._process = await asyncio.create_subprocess_exec(
                self.shell,
                *self.shell_args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=self.cwd,
            )
        except Exception as e:
            await self._send({"type": "error", "message": f"Failed to start shell: {e}"})
            return

        await self._send({
            "type": "ready",
            "session_id": self.session_id,
            "cwd": self.cwd,
        })

        # Run stdout reader and ws input listener concurrently
        self._read_task = asyncio.create_task(self._read_stdout())
        self._write_task = asyncio.create_task(self._read_ws())

        done, pending = await asyncio.wait(
            [self._read_task, self._write_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()

        await self._cleanup()

    async def _read_stdout(self):
        """Forward process stdout → WebSocket as base64 chunks."""
        assert self._process and self._process.stdout
        try:
            while True:
                chunk = await self._process.stdout.read(4096)
                if not chunk:
                    break
                encoded = base64.b64encode(chunk).decode("ascii")
                await self._send({"type": "output", "data": encoded})
        except (asyncio.CancelledError, ConnectionError):
            pass
        finally:
            code = self._process.returncode if self._process else -1
            try:
                await self._send({"type": "exit", "code": code or 0})
            except Exception:
                pass

    async def _read_ws(self):
        """Forward WebSocket input → process stdin."""
        assert self._process and self._process.stdin
        try:
            while True:
                raw = await self.ws.receive_text()
                msg = json.loads(raw)
                kind = msg.get("type")

                if kind == "input":
                    data = msg.get("data", "")
                    if data:
                        self._process.stdin.write(data.encode("utf-8"))
                        await self._process.stdin.drain()

                elif kind == "resize":
                    # resize not natively supported without winpty, silently ignore
                    pass

                elif kind == "ping":
                    await self._send({"type": "pong"})

        except (WebSocketDisconnect, asyncio.CancelledError):
            pass
        except Exception:
            pass

    async def _cleanup(self):
        if self._process:
            try:
                self._process.terminate()
                await asyncio.wait_for(self._process.wait(), timeout=3.0)
            except Exception:
                try:
                    self._process.kill()
                except Exception:
                    pass

    async def _send(self, payload: dict):
        try:
            await self.ws.send_text(json.dumps(payload))
        except Exception:
            pass
