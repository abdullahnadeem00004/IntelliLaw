from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import drafting
from app.core.config import settings
from app.core.database import init_qdrant
from app.api.ingest import router as ingest_router
from app.api.search import router as search_router

# This runs once when the server starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing databases...")
    init_qdrant()
    yield
    print("Shutting down databases...")

# Initialize the FastAPI application with the lifespan manager
app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Register the routes
app.include_router(ingest_router, prefix="/api/v1", tags=["Ingestion"])
app.include_router(search_router, prefix="/api/v1", tags=["Search & QA"])
app.include_router(drafting.router, prefix="/api/v1", tags=["Drafting"])
@app.get("/")
async def root():
    return {
        "message": "Welcome to the IntelliLaw AI API",
        "status": "Online",
        "database_connected": bool(settings.MONGODB_URI)
    }