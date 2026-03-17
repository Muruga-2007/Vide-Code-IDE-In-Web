from collections import defaultdict


class TokenTracker:
    def __init__(self):
        self._data: dict[str, dict[str, int]] = defaultdict(dict)

    def add(self, session_id: str, stage: str, count: int):
        self._data[session_id][stage] = self._data[session_id].get(stage, 0) + count

    def total(self, session_id: str) -> int:
        return sum(self._data[session_id].values())

    def summary(self, session_id: str) -> dict:
        return {
            "per_stage": dict(self._data[session_id]),
            "total": self.total(session_id),
        }

    def cleanup(self, session_id: str):
        self._data.pop(session_id, None)


token_tracker = TokenTracker()
