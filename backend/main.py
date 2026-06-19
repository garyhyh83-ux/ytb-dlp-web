import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path


@asynccontextmanager
async def lifespan(app: FastAPI):
    from database import init_db, get_db
    await init_db()

    # Start scheduled job checker
    async def scheduler_loop():
        while True:
            await asyncio.sleep(3600)  # Check every hour
            try:
                db = await get_db()
                cursor = await db.execute(
                    "SELECT * FROM scheduled_jobs WHERE enabled = 1"
                )
                jobs = await cursor.fetchall()
                await db.close()

                for job in jobs:
                    should_run = False
                    if job["cron_expr"] == "daily":
                        should_run = job["last_run"] is None or (
                            datetime.now() - datetime.fromisoformat(job["last_run"])
                        ).total_seconds() > 86400
                    elif job["cron_expr"] == "hourly":
                        should_run = job["last_run"] is None or (
                            datetime.now() - datetime.fromisoformat(job["last_run"])
                        ).total_seconds() > 3600

                    if should_run:
                        from task_manager import task_manager
                        task_id = await task_manager.create_task(
                            url=job["playlist_url"],
                            playlist_id=job["playlist_id"],
                        )
                        await task_manager.start_download(task_id)

                        db2 = await get_db()
                        await db2.execute(
                            "UPDATE scheduled_jobs SET last_run = datetime('now') WHERE id = ?",
                            (job["id"],),
                        )
                        await db2.commit()
                        await db2.close()
            except Exception:
                pass

    scheduler_task = asyncio.create_task(scheduler_loop())
    yield
    scheduler_task.cancel()
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
