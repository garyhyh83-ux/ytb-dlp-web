// frontend/src/types.ts

export type TaskStatus = 'pending' | 'downloading' | 'paused' | 'done' | 'failed';

export interface Task {
  id: string;
  url: string;
  title: string | null;
  thumbnail: string | null;
  platform: 'youtube' | 'bilibili' | null;
  format_id: string | null;
  format_note: string | null;
  status: TaskStatus;
  progress_percent: number;
  downloaded_bytes: number;
  total_bytes: number | null;
  speed: number | null;
  eta: number | null;
  output_path: string | null;
  file_size: number | null;
  playlist_id: string | null;
  playlist_index: number | null;
  status_message: string | null;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FormatInfo {
  format_id: string;
  format_note: string;
  ext: string;
  resolution: string | null;
  height: number | null;
  filesize: number | null;
  vcodec: string | null;
  acodec: string | null;
}

export interface VideoInfo {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  platform: string;
  webpage_url: string;
  is_playlist: boolean;
  playlist_title: string | null;
  playlist_count: number | null;
  formats: FormatInfo[];
  subtitles: Record<string, { name: string; url: string }[]>;
}

export interface Playlist {
  id: string;
  url: string;
  title: string | null;
  thumbnail: string | null;
  platform: string | null;
  total_count: number;
  completed_count: number;
  status: string;
  tasks: Task[];
  created_at: string | null;
  updated_at: string | null;
}

export interface Settings {
  download_dir: string;
  concurrency: string;
  filename_template: string;
  [key: string]: string;
}

export interface Stats {
  ytdlp_version: string;
  active_downloads: number;
  disk_free_gb: number;
  download_dir: string;
}

export interface HistoryPage {
  items: Task[];
  total: number;
  page: number;
  per_page: number;
}
