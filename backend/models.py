# backend/models.py
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TaskStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    PAUSED = "paused"
    DONE = "done"
    FAILED = "failed"


class ParseRequest(BaseModel):
    url: str


class FormatInfo(BaseModel):
    format_id: str
    format_note: str
    ext: str
    resolution: Optional[str] = None
    height: Optional[int] = None
    filesize: Optional[int] = None
    vcodec: Optional[str] = None
    acodec: Optional[str] = None


class VideoInfo(BaseModel):
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    platform: str
    webpage_url: str
    is_playlist: bool = False
    playlist_title: Optional[str] = None
    playlist_count: Optional[int] = None
    formats: list[FormatInfo] = []
    subtitles: dict[str, list[dict]] = {}


class DownloadRequest(BaseModel):
    url: str
    format_id: Optional[str] = None
    subtitle_lang: Optional[str] = None
    playlist_id: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    url: str
    title: Optional[str] = None
    thumbnail: Optional[str] = None
    platform: Optional[str] = None
    format_id: Optional[str] = None
    format_note: Optional[str] = None
    status: TaskStatus
    progress_percent: float = 0
    downloaded_bytes: int = 0
    total_bytes: Optional[int] = None
    speed: Optional[float] = None
    eta: Optional[int] = None
    output_path: Optional[str] = None
    file_size: Optional[int] = None
    playlist_id: Optional[str] = None
    playlist_index: Optional[int] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PlaylistResponse(BaseModel):
    id: str
    url: str
    title: Optional[str] = None
    thumbnail: Optional[str] = None
    platform: Optional[str] = None
    total_count: int = 0
    completed_count: int = 0
    status: str = "downloading"
    tasks: list[TaskResponse] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class HistoryQuery(BaseModel):
    search: Optional[str] = None
    platform: Optional[str] = None
    sort: str = "recent"
    page: int = 1
    per_page: int = 24


class SettingsUpdate(BaseModel):
    download_dir: Optional[str] = None
    concurrency: Optional[int] = None
    filename_template: Optional[str] = None


class StatsResponse(BaseModel):
    ytdlp_version: str
    active_downloads: int
    disk_free_gb: float
    download_dir: str
