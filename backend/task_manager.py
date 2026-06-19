# backend/task_manager.py
import asyncio
import uuid
import time
from typing import Optional
from database import get_db
from ytdlp_service import parse_url, download_video
from models import TaskStatus


class TaskManager:
    def __init__(self):
        self._semaphore: Optional[asyncio.Semaphore] = None
        self._active_downloads: dict[str, asyncio.Task] = {}
        self._paused_tasks: set[str] = set()
        self._cancelled_tasks: set[str] = set()
        self._ws_broadcast: callable = lambda msg: None

    def set_ws_broadcast(self, callback):
        self._ws_broadcast = callback

    async def _get_concurrency(self) -> int:
        db = await get_db()
        try:
            cursor = await db.execute("SELECT value FROM settings WHERE key='concurrency'")
            row = await cursor.fetchone()
            return int(row["value"]) if row else 3
        finally:
            await db.close()

    async def create_task(
        self, url: str, format_id: str | None = None,
        subtitle_lang: str | None = None, playlist_id: str | None = None
    ) -> str:
        """Parse URL and create a download task. Returns task ID."""
        video_info = await parse_url(url)
        task_id = str(uuid.uuid4())[:8]

        db = await get_db()
        try:
            await db.execute(
                """INSERT INTO tasks (id, url, title, thumbnail, platform, format_id,
                   format_note, status, playlist_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (task_id, video_info.webpage_url, video_info.title,
                 video_info.thumbnail, video_info.platform, format_id,
                 None, TaskStatus.PENDING.value, playlist_id),
            )
            await db.commit()
        finally:
            await db.close()

        await self._broadcast()
        return task_id

    async def start_download(self, task_id: str):
        """Begin downloading a pending/paused task."""
        if task_id in self._cancelled_tasks:
            return

        db = await get_db()
        try:
            cursor = await db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
            task = await cursor.fetchone()
        finally:
            await db.close()

        if not task:
            return

        # Read settings
        db = await get_db()
        try:
            cursor = await db.execute("SELECT value FROM settings WHERE key='download_dir'")
            dir_row = await cursor.fetchone()
            download_dir = dir_row["value"] if dir_row else "downloads"

            cursor = await db.execute("SELECT value FROM settings WHERE key='filename_template'")
            tmpl_row = await cursor.fetchone()
            filename_template = tmpl_row["value"] if tmpl_row else "%(title)s.%(ext)s"
        finally:
            await db.close()

        self._semaphore = self._semaphore or asyncio.Semaphore(await self._get_concurrency())

        async def _run():
            async with self._semaphore:
                if task_id in self._cancelled_tasks:
                    return
                await self._set_status(task_id, TaskStatus.DOWNLOADING)
                await self._broadcast()

                # Capture event loop NOW — progress_hook runs in a thread pool
                # thread where asyncio.get_running_loop() would fail
                loop = asyncio.get_running_loop()

                def progress_hook(d):
                    if d["status"] == "downloading":
                        asyncio.run_coroutine_threadsafe(
                            self._update_progress(task_id, d),
                            loop,
                        )
                    elif d["status"] == "finished":
                        asyncio.run_coroutine_threadsafe(
                            self._on_file_processed(task_id, d),
                            loop,
                        )

                try:
                    output = await download_video(
                        url=task["url"],
                        task_id=task_id,
                        download_dir=download_dir,
                        format_id=task["format_id"],
                        subtitle_lang=None,  # stored in task if needed
                        filename_template=filename_template,
                        progress_callback=progress_hook,
                    )
                    await self._set_status(task_id, TaskStatus.DONE, output_path=output)
                    # Update playlist count if part of one
                    if task["playlist_id"]:
                        await self._increment_playlist(task["playlist_id"])
                except Exception as e:
                    await self._set_status(task_id, TaskStatus.FAILED, error=str(e))
                finally:
                    await self._broadcast()

        self._active_downloads[task_id] = asyncio.create_task(_run())

    async def _update_progress(self, task_id: str, progress_data: dict):
        """Update task progress from yt-dlp hook."""
        db = await get_db()
        try:
            percent_str = progress_data.get("_percent_str", "0%")
            if percent_str:
                percent = float(percent_str.rstrip("%"))
            else:
                percent = 0
            await db.execute(
                """UPDATE tasks SET progress_percent = ?,
                   downloaded_bytes = ?, total_bytes = ?,
                   speed = ?, eta = ?,
                   updated_at = datetime('now')
                   WHERE id = ?""",
                (
                    percent,
                    progress_data.get("downloaded_bytes", 0),
                    progress_data.get("total_bytes") or progress_data.get("total_bytes_estimate"),
                    progress_data.get("speed"),
                    progress_data.get("eta"),
                    task_id,
                ),
            )
            await db.commit()
        finally:
            await db.close()
        await self._broadcast()

    async def _on_file_processed(self, task_id: str, data: dict):
        """Called when yt-dlp finishes processing a file."""
        db = await get_db()
        try:
            await db.execute(
                "UPDATE tasks SET output_path = ?, file_size = ?, updated_at = datetime('now') WHERE id = ?",
                (data.get("filename"), data.get("total_bytes"), task_id),
            )
            await db.commit()
        finally:
            await db.close()

    async def _set_status(self, task_id: str, status: TaskStatus,
                          output_path: str | None = None, error: str | None = None):
        db = await get_db()
        try:
            await db.execute(
                """UPDATE tasks SET status = ?, output_path = COALESCE(?, output_path),
                   error_message = ?, updated_at = datetime('now') WHERE id = ?""",
                (status.value, output_path, error, task_id),
            )
            await db.commit()
        finally:
            await db.close()

    async def _increment_playlist(self, playlist_id: str):
        db = await get_db()
        try:
            await db.execute(
                """UPDATE playlists SET completed_count = completed_count + 1,
                   updated_at = datetime('now') WHERE id = ?""",
                (playlist_id,),
            )
            # Check if all done
            cursor = await db.execute(
                "SELECT total_count, completed_count FROM playlists WHERE id = ?",
                (playlist_id,),
            )
            row = await cursor.fetchone()
            if row and row["completed_count"] >= row["total_count"]:
                await db.execute(
                    "UPDATE playlists SET status = 'done', updated_at = datetime('now') WHERE id = ?",
                    (playlist_id,),
                )
            await db.commit()
        finally:
            await db.close()

    async def pause_task(self, task_id: str):
        self._paused_tasks.add(task_id)
        await self._set_status(task_id, TaskStatus.PAUSED)
        if task_id in self._active_downloads:
            self._active_downloads[task_id].cancel()
            del self._active_downloads[task_id]
        await self._broadcast()

    async def resume_task(self, task_id: str):
        self._paused_tasks.discard(task_id)
        self._cancelled_tasks.discard(task_id)
        await self.start_download(task_id)

    async def cancel_task(self, task_id: str):
        self._cancelled_tasks.add(task_id)
        if task_id in self._active_downloads:
            self._active_downloads[task_id].cancel()
            del self._active_downloads[task_id]
        db = await get_db()
        try:
            await db.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
            await db.commit()
        finally:
            await db.close()
        await self._broadcast()

    async def start_all_pending(self):
        """Start all pending tasks (respecting concurrency)."""
        db = await get_db()
        try:
            cursor = await db.execute(
                "SELECT id FROM tasks WHERE status IN ('pending', 'paused')"
            )
            rows = await cursor.fetchall()
            for row in rows:
                self._cancelled_tasks.discard(row["id"])
                await self.start_download(row["id"])
        finally:
            await db.close()

    async def pause_all(self):
        db = await get_db()
        try:
            cursor = await db.execute("SELECT id FROM tasks WHERE status = 'downloading'")
            rows = await cursor.fetchall()
            for row in rows:
                await self.pause_task(row["id"])
        finally:
            await db.close()

    async def get_tasks(self, status_filter: str | None = None) -> list[dict]:
        db = await get_db()
        try:
            if status_filter:
                cursor = await db.execute(
                    "SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC",
                    (status_filter,),
                )
            else:
                cursor = await db.execute("SELECT * FROM tasks ORDER BY created_at DESC")
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            await db.close()

    async def get_task(self, task_id: str) -> dict | None:
        db = await get_db()
        try:
            cursor = await db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
            row = await cursor.fetchone()
            return dict(row) if row else None
        finally:
            await db.close()

    async def shutdown(self):
        for task_id in list(self._active_downloads.keys()):
            self._active_downloads[task_id].cancel()
        await self._broadcast()

    async def _broadcast(self):
        if self._ws_broadcast:
            tasks = await self.get_tasks()
            msg = {
                "type": "tasks_update",
                "tasks": tasks,
            }
            result = self._ws_broadcast(msg)
            # _ws_broadcast may be sync (lambda) or async (websocket handler)
            if hasattr(result, '__await__'):
                await result


# Singleton
task_manager = TaskManager()
