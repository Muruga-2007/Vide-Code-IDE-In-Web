"""
File System REST API — CRUD operations on the workspace.

All paths are validated to stay within WORKSPACE_ROOT by FileSystemManager.
"""

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
