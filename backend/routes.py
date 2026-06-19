# backend/routes.py
import asyncio
import json
import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from database import get_db
from models import (
    ParseRequest, DownloadRequest, TaskResponse, PlaylistResponse,
    HistoryQuery, SettingsUpdate, StatsResponse, CreateScheduledJob,
)
from task_manager import task_manager
from ytdlp_service import parse_url
import yt_dlp

router = APIRouter()

# ── Parse ──────────────────────────────────────────

@router.post("/parse")
async def parse(req: ParseRequest):
    try:
        info = await parse_url(req.url)
        return info.model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Download ───────────────────────────────────────

@router.post("/download")
async def create_download(req: DownloadRequest):
    task_id = await task_manager.create_task(
        url=req.url,
        format_id=req.format_id,
        subtitle_lang=req.subtitle_lang,
        playlist_id=req.playlist_id,
    )
    await task_manager.start_download(task_id)
    return {"task_id": task_id}


@router.get("/downloads")
async def list_downloads(status: str | None = None):
    tasks = await task_manager.get_tasks(status_filter=status)
    return {"tasks": tasks}


@router.get("/downloads/{task_id}")
async def get_download(task_id: str):
    task = await task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/downloads/{task_id}/pause")
async def pause_download(task_id: str):
    await task_manager.pause_task(task_id)
    return {"status": "paused"}


@router.post("/downloads/{task_id}/resume")
async def resume_download(task_id: str):
    await task_manager.resume_task(task_id)
    return {"status": "resumed"}


@router.delete("/downloads/{task_id}")
async def delete_download(task_id: str):
    await task_manager.cancel_task(task_id)
    return {"status": "deleted"}


@router.post("/downloads/pause-all")
async def pause_all():
    await task_manager.pause_all()
    return {"status": "ok"}


@router.post("/downloads/resume-all")
async def resume_all():
    await task_manager.start_all_pending()
    return {"status": "ok"}


# ── History ────────────────────────────────────────

@router.get("/history")
async def list_history(
    search: str | None = None,
    platform: str | None = None,
    sort: str = "recent",
    page: int = 1,
    per_page: int = 24,
):
    db = await get_db()
    try:
        query = "SELECT * FROM tasks WHERE status = 'done'"
        params: list = []

        if search:
            query += " AND title LIKE ?"
            params.append(f"%{search}%")
        if platform:
            query += " AND platform = ?"
            params.append(platform)

        if sort == "recent":
            query += " ORDER BY updated_at DESC"
        elif sort == "size":
            query += " ORDER BY COALESCE(file_size, total_bytes, 0) DESC"
        elif sort == "title":
            query += " ORDER BY title ASC"

        offset = (page - 1) * per_page
        query += " LIMIT ? OFFSET ?"
        params.extend([per_page, offset])

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()

        # Get total count
        count_query = "SELECT COUNT(*) as total FROM tasks WHERE status = 'done'"
        count_params: list = []
        if search:
            count_query += " AND title LIKE ?"
            count_params.append(f"%{search}%")
        if platform:
            count_query += " AND platform = ?"
            count_params.append(platform)
        cursor2 = await db.execute(count_query, count_params)
        total = (await cursor2.fetchone())["total"]

        return {
            "items": [dict(row) for row in rows],
            "total": total,
            "page": page,
            "per_page": per_page,
        }
    finally:
        await db.close()


# ── Playlists ──────────────────────────────────────

@router.get("/playlists")
async def list_playlists():
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM playlists ORDER BY updated_at DESC"
        )
        rows = await cursor.fetchall()
        playlists = []
        for row in rows:
            p = dict(row)
            # Get tasks for this playlist
            cursor2 = await db.execute(
                "SELECT * FROM tasks WHERE playlist_id = ? ORDER BY playlist_index",
                (p["id"],),
            )
            p["tasks"] = [dict(t) for t in await cursor2.fetchall()]
            playlists.append(p)
        return {"playlists": playlists}
    finally:
        await db.close()


# ── Settings ───────────────────────────────────────

@router.get("/settings")
async def get_settings():
    db = await get_db()
    try:
        cursor = await db.execute("SELECT key, value FROM settings")
        rows = await cursor.fetchall()
        return {row["key"]: row["value"] for row in rows}
    finally:
        await db.close()


@router.put("/settings")
async def update_settings(update: SettingsUpdate):
    db = await get_db()
    try:
        updates = update.model_dump(exclude_none=True)
        for key, value in updates.items():
            await db.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                (key, str(value)),
            )
        await db.commit()
        # Update semaphore if concurrency changed
        if "concurrency" in updates:
            task_manager._semaphore = asyncio.Semaphore(int(updates["concurrency"]))
        return {"status": "ok"}
    finally:
        await db.close()


@router.post("/settings/cookie")
async def upload_cookie(platform: str, file: UploadFile):
    cookie_dir = Path("cookies")
    cookie_dir.mkdir(exist_ok=True)
    cookie_path = cookie_dir / f"{platform}.txt"
    with open(cookie_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"status": "ok", "path": str(cookie_path)}


# ── Stats ──────────────────────────────────────────

@router.get("/stats")
async def get_stats():
    active = len(task_manager._active_downloads)
    download_dir = "downloads"

    db = await get_db()
    try:
        cursor = await db.execute("SELECT value FROM settings WHERE key='download_dir'")
        row = await cursor.fetchone()
        if row:
            download_dir = row["value"]
    finally:
        await db.close()

    # Get disk free space
    try:
        usage = shutil.disk_usage(download_dir)
        disk_free = usage.free / (1024 ** 3)  # GB
    except Exception:
        disk_free = 0

    return StatsResponse(
        ytdlp_version=yt_dlp.version.__version__,
        active_downloads=active,
        disk_free_gb=round(disk_free, 1),
        download_dir=download_dir,
    ).model_dump()


# ── Scheduled Jobs ─────────────────────────────────

@router.get("/scheduled-jobs")
async def list_scheduled_jobs():
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM scheduled_jobs ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return {"jobs": [dict(row) for row in rows]}
    finally:
        await db.close()


@router.post("/scheduled-jobs")
async def create_scheduled_job(job: CreateScheduledJob):
    job_id = str(uuid.uuid4())[:8]
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO scheduled_jobs (id, playlist_url, cron_expr) VALUES (?, ?, ?)",
            (job_id, job.playlist_url, job.cron_expr),
        )
        await db.commit()
        return {"id": job_id, "status": "created"}
    finally:
        await db.close()


@router.delete("/scheduled-jobs/{job_id}")
async def delete_scheduled_job(job_id: str):
    db = await get_db()
    try:
        await db.execute("DELETE FROM scheduled_jobs WHERE id = ?", (job_id,))
        await db.commit()
        return {"status": "deleted"}
    finally:
        await db.close()


# ── WebSocket ──────────────────────────────────────

ACTIVE_WS: list[WebSocket] = []


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    ACTIVE_WS.append(ws)

    async def broadcast(msg: dict):
        dead = []
        for w in ACTIVE_WS:
            try:
                await w.send_json(msg)
            except Exception:
                dead.append(w)
        for w in dead:
            ACTIVE_WS.remove(w)

    # Register WebSocket broadcaster with task manager
    task_manager.set_ws_broadcast(broadcast)

    # Send current state on connect
    tasks = await task_manager.get_tasks()
    await ws.send_json({"type": "tasks_update", "tasks": tasks})

    try:
        while True:
            data = await ws.receive_text()
            # Client can send ping to keep alive
            if data == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        if ws in ACTIVE_WS:
            ACTIVE_WS.remove(ws)
