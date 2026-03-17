from pydantic import BaseModel
from typing import Optional, Literal
from enum import Enum


# ─── Project Types ────────────────────────────────────────────────────────────

class ProjectType(str, Enum):
    FRONTEND   = "frontend"
    BACKEND    = "backend"
    FULLSTACK  = "fullstack"
    MICRO_SAAS = "micro_saas"


# ─── File Manifest (Ground-Tower) ─────────────────────────────────────────────

class FileEntry(BaseModel):
    path: str
    type: str  # "core" | "config" | "schema" | "util" | "test" | "docs"
    description: str
    complexity: Literal["high", "medium", "low"] = "medium"


class FileManifest(BaseModel):
    project_name: str
    description: str
    tech_stack: list[str]
    files: list[FileEntry]


# ─── Image Upload ─────────────────────────────────────────────────────────────

class ImagePart(BaseModel):
    mime_type: str  # "image/png" | "image/jpeg" | "image/webp"
    data: str       # base64 encoded


# ─── Pipeline Request / Response ──────────────────────────────────────────────

class PipelineStartRequest(BaseModel):
    prompt: str
    language: str = "python"
    context: Optional[str] = None
    mode: Literal["single_file", "multi_file"] = "single_file"
    project_type: Optional[ProjectType] = None
    images: list[ImagePart] = []


class PipelineStartResponse(BaseModel):
    session_id: str


class StageResult(BaseModel):
    stage: str
    output: str
    token_count: int


class PipelineResult(BaseModel):
    session_id: str
    stages: list[StageResult]
    final_code: str
    language: str
    token_summary: dict


# ─── File System ──────────────────────────────────────────────────────────────

class FileReadRequest(BaseModel):
    path: str


class FileWriteRequest(BaseModel):
    path: str
    content: str


class FileCreateRequest(BaseModel):
    path: str
    type: Literal["file", "folder"] = "file"


class FileRenameRequest(BaseModel):
    old_path: str
    new_path: str


class FileOpResponse(BaseModel):
    ok: bool
    path: Optional[str] = None
    error: Optional[str] = None
