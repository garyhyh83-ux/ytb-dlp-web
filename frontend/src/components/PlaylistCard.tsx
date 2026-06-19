// frontend/src/components/PlaylistCard.tsx
import { useState } from 'react';
import type { Playlist } from '../types';
import TaskCard from './TaskCard';

interface Props {
  playlist: Playlist;
}

export default function PlaylistCard({ playlist }: Props) {
  const [expanded, setExpanded] = useState(false);
  const pct = playlist.total_count > 0
    ? Math.round((playlist.completed_count / playlist.total_count) * 100)
    : 0;

  return (
    <div className="playlist-card">
      <div className="playlist-header" onClick={() => setExpanded(!expanded)}>
        <div className="playlist-thumb">
          {playlist.thumbnail ? (
            <img src={playlist.thumbnail} alt="" />
          ) : (
            <div className="video-card-thumb-placeholder">📋</div>
          )}
        </div>
        <div className="playlist-info">
          <div className="playlist-title">{playlist.title || playlist.url}</div>
          <div className="playlist-meta">
            {playlist.completed_count}/{playlist.total_count} 已完成
          </div>
          <div className="playlist-progress-bar">
            <div className="playlist-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="playlist-expand">{expanded ? '▾' : '▸'}</div>
      </div>

      {expanded && (
        <div className="playlist-tasks">
          {playlist.tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          {playlist.tasks.length === 0 && (
            <div className="empty-state" style={{ padding: '20px' }}>
              <p>暂无任务</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
