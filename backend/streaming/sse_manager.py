import asyncio
import json
from collections import defaultdict


class SSEManager:
    def __init__(self):
        self._queues: dict[str, asyncio.Queue] = defaultdict(asyncio.Queue)

    async def emit(self, session_id: str, event_type: str, data: dict):
        payload = {"type": event_type, **data}
        await self._queues[session_id].put(payload)

    async def stream(self, session_id: str):
        """AsyncGenerator for FastAPI StreamingResponse."""
        queue = self._queues[session_id]
        while True:
            event = await queue.get()
            yield f"event: {event['type']}\ndata: {json.dumps(event)}\n\n"
            if event["type"] == "done":
                break

    def cleanup(self, session_id: str):
        self._queues.pop(session_id, None)


sse_manager = SSEManager()
