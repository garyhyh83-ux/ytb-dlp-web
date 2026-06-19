# backend/ytdlp_service.py
import asyncio
import os
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Callable
import yt_dlp
from models import VideoInfo, FormatInfo

EXECUTOR = ThreadPoolExecutor(max_workers=8)


def _extract_info(url: str, download: bool, options: dict | None = None) -> dict:
    """Run yt-dlp extract_info in a thread (it's blocking)."""
    opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        **(options or {}),
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=download)


def detect_platform(url: str) -> str:
    url_lower = url.lower()
    if "bilibili.com" in url_lower or "b23.tv" in url_lower:
        return "bilibili"
    if "youtube.com" in url_lower or "youtu.be" in url_lower:
        return "youtube"
    return "other"


async def parse_url(url: str) -> VideoInfo:
    """Parse a URL and return video/playlist metadata without downloading."""
    loop = asyncio.get_running_loop()
    info = await loop.run_in_executor(
        EXECUTOR, partial(_extract_info, url, False)
    )
    return _info_to_video(info)


def _info_to_video(info: dict) -> VideoInfo:
    """Convert yt-dlp info dict to VideoInfo model."""
    formats = []
    for f in info.get("formats", []):
        if f.get("format_id") and (f.get("vcodec") != "none" or f.get("acodec") != "none"):
            formats.append(FormatInfo(
                format_id=f["format_id"],
                format_note=f.get("format_note", "unknown"),
                ext=f.get("ext", "unknown"),
                resolution=f.get("resolution"),
                height=f.get("height"),
                filesize=f.get("filesize"),
                vcodec=f.get("vcodec"),
                acodec=f.get("acodec"),
            ))

    is_playlist = info.get("_type") == "playlist" or "entries" in info

    return VideoInfo(
        title=info.get("title", "Unknown"),
        thumbnail=info.get("thumbnail"),
        duration=info.get("duration"),
        platform=detect_platform(info.get("webpage_url", "")),
        webpage_url=info.get("webpage_url", ""),
        is_playlist=is_playlist,
        playlist_title=info.get("title") if is_playlist else None,
        playlist_count=len(info.get("entries", [])) if is_playlist else None,
        formats=formats,
        subtitles=info.get("subtitles", {}),
    )


async def parse_playlist(url: str) -> tuple[VideoInfo, list[dict]]:
    """Parse a playlist URL, return playlist info and list of video entries."""
    loop = asyncio.get_running_loop()
    info = await loop.run_in_executor(
        EXECUTOR, partial(_extract_info, url, False)
    )
    playlist_info = _info_to_video(info)

    entries: list[dict] = []
    raw_entries = info.get("entries", [])
    if isinstance(raw_entries, list):
        for entry in raw_entries:
            if entry and isinstance(entry, dict):
                entries.append({
                    "url": entry.get("webpage_url") or entry.get("url") or entry.get("original_url", ""),
                    "title": entry.get("title", "Unknown"),
                    "thumbnail": entry.get("thumbnail"),
                    "duration": entry.get("duration"),
                })

    return playlist_info, entries


async def download_video(
    url: str,
    task_id: str,
    download_dir: str,
    format_id: str | None,
    subtitle_lang: str | None,
    filename_template: str,
    progress_callback: Callable,
    cookies_path: str | None = None,
) -> str:
    """Download a video with progress callbacks. Returns output path."""
    # Ensure download directory exists (resolve relative paths)
    download_dir = os.path.abspath(download_dir)
    os.makedirs(download_dir, exist_ok=True)

    ydl_opts = {
        "outtmpl": f"{download_dir}/{filename_template}",
        "quiet": True,
        "no_warnings": True,
        "progress_hooks": [progress_callback],
        "noprogress": True,
    }

    if format_id:
        ydl_opts["format"] = format_id
    else:
        ydl_opts["format"] = "bestvideo[height<=2160]+bestaudio/best[height<=2160]/best"

    if subtitle_lang:
        ydl_opts["writesubtitles"] = True
        ydl_opts["writeautomaticsub"] = True
        ydl_opts["subtitleslangs"] = [subtitle_lang]

    if cookies_path:
        ydl_opts["cookiefile"] = cookies_path

    loop = asyncio.get_running_loop()
    info = await loop.run_in_executor(
        EXECUTOR, partial(_extract_info, url, True, ydl_opts)
    )

    # Determine output path from the info dict
    requested_downloads = info.get("requested_downloads", [])
    if requested_downloads:
        return requested_downloads[0].get("filepath", "")
    return info.get("_filename", "")
