// frontend/src/components/VideoCard.tsx
import type { Task } from '../types';

interface Props {
  task: Task;
  onClick: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

export default function VideoCard({ task, onClick }: Props) {
  return (
    <div className="video-card" onClick={onClick}>
      <div className="video-card-thumb">
        {task.thumbnail ? (
          <img src={task.thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="video-card-thumb-placeholder">🎬</div>
        )}
        <span className="video-card-platform">
          {task.platform === 'youtube' ? 'YT' : task.platform === 'bilibili' ? 'B站' : task.platform}
        </span>
      </div>
      <div className="video-card-body">
        <div className="video-card-title" title={task.title || ''}>
          {task.title || task.url}
        </div>
        <div className="video-card-meta">
          <span>{task.file_size ? formatBytes(task.file_size) : (task.total_bytes ? formatBytes(task.total_bytes) : '—')}</span>
          <span>{timeAgo(task.updated_at || task.created_at || '')}</span>
        </div>
      </div>
    </div>
  );
}
