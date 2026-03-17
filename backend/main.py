from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from api.routes import health, pipeline, files, terminal


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure workspace root exists on startup
    Path(settings.WORKSPACE_ROOT).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="Vibe Coding Tool",
    description="Multi-model Gemini pipeline for AI-powered code generation",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routes
app.include_router(health.router, prefix="/api")
app.include_router(pipeline.router, prefix="/api/pipeline")
app.include_router(files.router, prefix="/api/files")

# WebSocket routes (no prefix — path defined in the route itself)
app.include_router(terminal.router)
