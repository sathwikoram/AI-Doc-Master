from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from contextlib import asynccontextmanager
from loguru import logger

from app.config import settings
from app.database import create_tables

# API routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.advocates import router as advocates_router
from app.api.cases import router as cases_router
from app.api.hearings import router as hearings_router
from app.api.appointments import router as appointments_router
from app.api.notifications import router as notifications_router
from app.api.ai_routes import router as ai_router
from app.api.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    # Create upload directories
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)
    # Auto-create tables in dev (use Alembic in production)
    if settings.DEBUG:
        await create_tables()
    logger.info("Database tables ready")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Legal Assistance & Case Management Platform",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file serving (uploaded documents) ───────────────────────────────────
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(advocates_router)
app.include_router(cases_router)
app.include_router(hearings_router)
app.include_router(appointments_router)
app.include_router(notifications_router)
app.include_router(ai_router)
app.include_router(admin_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
