# backend/database.py
import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "ytb-dlp.db"


async def get_db():
    """Get an async database connection."""
    db = await aiosqlite.connect(str(DB_PATH))
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    """Create tables if they don't exist."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = await get_db()
    try:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                title TEXT,
                thumbnail TEXT,
                platform TEXT,
                format_id TEXT,
                format_note TEXT,
                status TEXT DEFAULT 'pending',
                progress_percent REAL DEFAULT 0,
                downloaded_bytes INTEGER DEFAULT 0,
                total_bytes INTEGER,
                speed REAL,
                eta INTEGER,
                output_path TEXT,
                file_size INTEGER,
                playlist_id TEXT,
                playlist_index INTEGER,
                error_message TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                title TEXT,
                thumbnail TEXT,
                platform TEXT,
                total_count INTEGER DEFAULT 0,
                completed_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'downloading',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );

            INSERT OR IGNORE INTO settings (key, value) VALUES
                ('download_dir', 'downloads'),
                ('concurrency', '3'),
                ('filename_template', '%(title)s.%(ext)s');
        """)
        await db.commit()
    finally:
        await db.close()
