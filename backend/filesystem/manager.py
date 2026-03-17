"""
FileSystemManager — safe async file operations confined to WORKSPACE_ROOT.

All public methods resolve the supplied path to an absolute real path and
verify it sits inside WORKSPACE_ROOT before touching the disk.  Any path
that escapes the workspace (e.g. ../../etc/passwd) raises PermissionError.
"""

import os
import aiofiles
import aiofiles.os
from pathlib import Path
from typing import Optional


class FileSystemManager:
    def __init__(self, workspace_root: str):
        self.root = Path(workspace_root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    # ─── Safety ───────────────────────────────────────────────────────────────

    def _safe(self, path: str) -> Path:
        """Resolve path and assert it lives inside the workspace root."""
        resolved = Path(path).resolve()
        try:
            resolved.relative_to(self.root)
        except ValueError:
            raise PermissionError(
                f"Path '{path}' escapes the workspace root '{self.root}'"
            )
        return resolved

    # ─── Tree ─────────────────────────────────────────────────────────────────

    def tree(self, root: Optional[str] = None) -> dict:
        """Return a JSON-serialisable recursive file tree."""
        base = self._safe(root) if root else self.root
        return {
            "root": str(self.root),
            "tree": self._node(base),
        }

    def _node(self, path: Path) -> dict:
        stat = path.stat()
        node: dict = {
            "name": path.name,
            "path": str(path),
            "type": "folder" if path.is_dir() else "file",
            "extension": path.suffix if path.is_file() else "",
            "size": stat.st_size,
            "modified": stat.st_mtime,
            "children": None,
        }
        if path.is_dir():
            children = []
            try:
                for child in sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name.lower())):
                    # skip hidden files and __pycache__
                    if child.name.startswith(".") or child.name == "__pycache__":
                        continue
                    children.append(self._node(child))
            except PermissionError:
                pass
            node["children"] = children
        return node

    # ─── Read ─────────────────────────────────────────────────────────────────

    async def read(self, path: str) -> dict:
        p = self._safe(path)
        if not p.exists():
            raise FileNotFoundError(f"'{path}' does not exist")
        if p.is_dir():
            raise IsADirectoryError(f"'{path}' is a directory")
        async with aiofiles.open(p, "r", encoding="utf-8", errors="replace") as f:
            content = await f.read()
        return {
            "path": str(p),
            "content": content,
            "encoding": "utf-8",
            "size": p.stat().st_size,
        }

    # ─── Write ────────────────────────────────────────────────────────────────

    async def write(self, path: str, content: str) -> dict:
        p = self._safe(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(p, "w", encoding="utf-8") as f:
            await f.write(content)
        return {"ok": True, "path": str(p)}

    # ─── Create ───────────────────────────────────────────────────────────────

    async def create(self, path: str, kind: str = "file") -> dict:
        p = self._safe(path)
        if kind == "folder":
            p.mkdir(parents=True, exist_ok=True)
        else:
            p.parent.mkdir(parents=True, exist_ok=True)
            if not p.exists():
                p.touch()
        return {"ok": True, "path": str(p)}

    # ─── Delete ───────────────────────────────────────────────────────────────

    async def delete(self, path: str) -> dict:
        p = self._safe(path)
        if not p.exists():
            raise FileNotFoundError(f"'{path}' does not exist")
        if p.is_dir():
            import shutil
            await aiofiles.os.wrap(shutil.rmtree)(p)
        else:
            await aiofiles.os.remove(p)
        return {"ok": True, "path": str(p)}

    # ─── Rename / Move ────────────────────────────────────────────────────────

    async def rename(self, old_path: str, new_path: str) -> dict:
        src = self._safe(old_path)
        dst = self._safe(new_path)
        if not src.exists():
            raise FileNotFoundError(f"'{old_path}' does not exist")
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)
        return {"ok": True, "path": str(dst)}
