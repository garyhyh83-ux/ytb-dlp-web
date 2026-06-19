from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: init database
    from database import init_db
    await init_db()
    yield
    # Shutdown: clean up active downloads
    from task_manager import task_manager
    await task_manager.shutdown()


app = FastAPI(title="yt-dlp Web", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import router
app.include_router(router, prefix="/api")

# Serve frontend static files in production
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")
