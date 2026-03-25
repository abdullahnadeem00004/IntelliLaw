import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import httpx

from core.config import settings
from tools.mongo_client import ping as mongo_ping

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)

app = FastAPI(title="IntelliLaw Agents", version="0.1.0")

# CORS — allow frontend and backend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount agent routers
from citation_agent.router import router as citation_router
from research_agent.router import router as research_router
from drafter_agent.router import router as drafter_router

app.include_router(citation_router)
app.include_router(research_router)
app.include_router(drafter_router)


@app.get("/")
async def root() -> dict:
    return {"service": "IntelliLaw Agents", "status": "running"}


@app.get("/agents/health")
async def health() -> dict:
    mongo_ok = mongo_ping()

    gemini_ok = bool(settings.GEMINI_API_KEY)

    ollama_ok = False
    ollama_model_loaded = False
    try:
        resp = httpx.get(f"{settings.OLLAMA_URL}/api/tags", timeout=5.0)
        if resp.status_code == 200:
            ollama_ok = True
            models = [m["name"] for m in resp.json().get("models", [])]
            ollama_model_loaded = any(settings.OLLAMA_MODEL in m for m in models)
    except Exception:
        pass

    llm_available = gemini_ok or ollama_ok
    healthy = mongo_ok and llm_available

    return {
        "status": "ok" if healthy else "degraded",
        "mongodb": "connected" if mongo_ok else "disconnected",
        "gemini": "configured" if gemini_ok else "no_api_key",
        "ollama": "running" if ollama_ok else "unreachable",
        "ollama_model": settings.OLLAMA_MODEL if ollama_model_loaded else "not_loaded",
        "llm_strategy": "gemini_primary_ollama_fallback" if gemini_ok else "ollama_only",
    }
