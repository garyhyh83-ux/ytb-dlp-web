// frontend/src/components/DetailPanel.tsx
import { useState } from 'react';
import type { Task } from '../types';

interface Props {
  task: Task | null;
  onClose: () => void;
}

const VIDEO_EXTS = ['.mp4', '.webm', '.mkv', '.flv', '.avi', '.mov', '.ts'];

function isPlayableVideo(path: string | null): boolean {
  if (!path) return false;
  const lower = path.toLowerCase();
  return VIDEO_EXTS.some(ext => lower.endsWith(ext));
}

export default function DetailPanel({ task, onClose }: Props) {
  const [showPlayer, setShowPlayer] = useState(false);

  if (!task) return null;

  const details = [
    ['平台', task.platform],
    ['画质', task.format_note],
    ['格式 ID', task.format_id],
    ['状态', task.status],
    ['文件大小', task.file_size ? `${(task.file_size / 1_000_000).toFixed(0)} MB` : '—'],
    ['本地路径', task.output_path || '—'],
    ['URL', task.url],
    ['创建时间', task.created_at],
    ['完成时间', task.updated_at],
    ['错误信息', task.error_message],
  ].filter(([, v]) => v != null);

  const canPlay = task.status === 'done' && isPlayableVideo(task.output_path);

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <div className="detail-panel">
        <div className="detail-header">
          <h3>任务详情</h3>
          <button className="detail-close" onClick={onClose}>✕</button>
        </div>

        {/* Video Player */}
        {canPlay && (
          <div className="detail-player-section">
            {!showPlayer ? (
              <div className="detail-player-placeholder" onClick={() => setShowPlayer(true)}>
                <span className="detail-player-play-icon">▶</span>
                <span>点击播放</span>
              </div>
            ) : (
              <video
                className="detail-video"
                controls
                autoPlay
                src={`/api/media?path=${encodeURIComponent(task.output_path!)}`}
              >
                您的浏览器不支持视频播放
              </video>
            )}
          </div>
        )}

        {!canPlay && task.thumbnail && (
          <img src={task.thumbnail} alt="" className="detail-thumb" />
        )}

        <h4 className="detail-title">{task.title || '未知'}</h4>

        <dl className="detail-list">
          {details.map(([label, value]) => (
            <div key={label} className="detail-row">
              <dt>{label}</dt>
              <dd title={String(value)}>{String(value)}</dd>
            </div>
          ))}
        </dl>

        {task.output_path && (
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
            onClick={() => navigator.clipboard.writeText(task.output_path!)}
          >
            📋 复制文件路径
          </button>
        )}
      </div>
    </>
  );
}
