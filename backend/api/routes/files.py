"""
File System REST API — CRUD operations on the workspace, plus checkpoint/restore.
"""

import zipfile
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from config import settings
from filesystem.manager import FileSystemManager
from models.schemas import (
    FileReadRequest,
    FileWriteRequest,
    FileCreateRequest,
    FileRenameRequest,
    FileOpResponse,
)

CHECKPOINTS_DIR = Path(settings.WORKSPACE_ROOT) / ".checkpoints"

router = APIRouter()
fs = FileSystemManager(settings.WORKSPACE_ROOT)


# ─── Tree ─────────────────────────────────────────────────────────────────────

@router.get("/tree")
async def get_tree(root: Optional[str] = Query(default=None)):
    try:
        return fs.tree(root)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── Read ─────────────────────────────────────────────────────────────────────

@router.post("/read")
async def read_file(req: FileReadRequest):
    try:
        return await fs.read(req.path)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IsADirectoryError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Write ────────────────────────────────────────────────────────────────────

@router.post("/write", response_model=FileOpResponse)
async def write_file(req: FileWriteRequest):
    try:
        result = await fs.write(req.path, req.content)
        return FileOpResponse(**result)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Create ───────────────────────────────────────────────────────────────────

@router.post("/create", response_model=FileOpResponse)
async def create_file(req: FileCreateRequest):
    try:
        result = await fs.create(req.path, req.type)
        return FileOpResponse(**result)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Delete ───────────────────────────────────────────────────────────────────

@router.delete("/delete", response_model=FileOpResponse)
async def delete_file(path: str = Query(...)):
    try:
        result = await fs.delete(path)
        return FileOpResponse(**result)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Rename ───────────────────────────────────────────────────────────────────

@router.post("/rename", response_model=FileOpResponse)
async def rename_file(req: FileRenameRequest):
    try:
        result = await fs.rename(req.old_path, req.new_path)
        return FileOpResponse(**result)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Checkpoints ──────────────────────────────────────────────────────────────

@router.post("/checkpoint")
async def create_checkpoint(label: Optional[str] = Query(default=None)):
    """Zip the entire workspace into .checkpoints/<timestamp>_<label>.zip"""
    try:
        CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        name = f"{ts}_{label}" if label else ts
        zip_path = CHECKPOINTS_DIR / f"{name}.zip"

        workspace = Path(settings.WORKSPACE_ROOT)
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for file in workspace.rglob("*"):
                if ".checkpoints" in file.parts:
                    continue
                if file.is_file():
                    zf.write(file, file.relative_to(workspace))

        return {
            "ok": True,
            "name": name,
            "path": str(zip_path),
            "size": zip_path.stat().st_size,
            "created_at": ts,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/checkpoints")
async def list_checkpoints():
    """List available checkpoint zip files."""
    try:
        CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)
        items = []
        for f in sorted(CHECKPOINTS_DIR.glob("*.zip"), key=lambda p: p.stat().st_mtime, reverse=True):
            items.append({
                "name": f.stem,
                "filename": f.name,
                "size": f.stat().st_size,
                "created_at": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
            })
        return {"checkpoints": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/restore/{checkpoint_name}")
async def restore_checkpoint(checkpoint_name: str):
    """Restore workspace from a checkpoint zip."""
    try:
        zip_path = CHECKPOINTS_DIR / f"{checkpoint_name}.zip"
        if not zip_path.exists():
            # Try with .zip already in name
            zip_path = CHECKPOINTS_DIR / checkpoint_name
        if not zip_path.exists():
            raise HTTPException(status_code=404, detail=f"Checkpoint '{checkpoint_name}' not found")

        workspace = Path(settings.WORKSPACE_ROOT)
        # Clear workspace (except .checkpoints dir)
        for item in workspace.iterdir():
            if item.name == ".checkpoints":
                continue
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()

        # Extract
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(workspace)

        return {"ok": True, "restored_from": checkpoint_name}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
