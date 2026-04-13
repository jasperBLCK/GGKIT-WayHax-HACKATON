from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from app.auth.routes import router as auth_router
from app.users.routes import router as users_router
from app.contests.routes import router as contests_router
from app.applications.routes import router as applications_router
from app.certificates.routes import router as certificates_router

from app.auth.models import Auth
from app.users.models import User
from app.contests.models import Contest
from app.applications.models import Application
from app.certificates.models import Certificate

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WayHax API",
    description="API для WayHax",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://frontend:3000",          # Docker внутренняя сеть
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(contests_router, prefix="/contests", tags=["Contests"])
app.include_router(applications_router, prefix="/applications", tags=["Applications"])
app.include_router(certificates_router, prefix="/certificates", tags=["Certificates"])

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
static_dir = BASE_DIR / "app" / "static"

uploads_dir = static_dir / "uploads" / "avatars"
uploads_dir.mkdir(parents=True, exist_ok=True)
contests_images_dir = static_dir / "uploads" / "contests"
contests_images_dir.mkdir(parents=True, exist_ok=True)
contests_files_dir = static_dir / "uploads" / "contests" / "files"
contests_files_dir.mkdir(parents=True, exist_ok=True)
certificates_dir = static_dir / "uploads" / "certificates"
certificates_dir.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/", tags=["Root"])
async def root():
    """Корневой эндпоинт API"""
    return {"message": "WayHax API", "version": "1.0.0"}


