import React, { useState, useCallback } from 'react';
import { Task } from '../types';
import { api } from '../api/client';
import ProgressBar from './ProgressBar';
import ConfirmDialog from './ConfirmDialog';

interface TaskCardProps {
  task: Task;
  onUpdate?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)}GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)}MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)}KB`;
  return `${bytes}B`;
}

function formatSize(fromBytes: number, toBytes: number | null): string {
  if (toBytes != null) {
    return `${formatBytes(fromBytes)} / ${formatBytes(toBytes)}`;
  }
  return formatBytes(fromBytes);
}

const platformBadge: Record<string, { label: string; bg: string }> = {
  youtube: { label: 'YT', bg: '#ff4444' },
  bilibili: { label: 'B站', bg: '#fb7299' },
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handlePauseResume = useCallback(async () => {
    setActionLoading(true);
    try {
      if (task.status === 'paused') {
        await api.resumeTask(task.id);
      } else {
        await api.pauseTask(task.id);
      }
      onUpdate?.();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }, [task.id, task.status, onUpdate]);

  const handleCancel = useCallback(async () => {
    setConfirmOpen(false);
    setActionLoading(true);
    try {
      await api.deleteTask(task.id);
      onUpdate?.();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }, [task.id, onUpdate]);

  const handleCopyPath = useCallback(async () => {
    if (task.output_path) {
      try {
        await navigator.clipboard.writeText(task.output_path);
      } catch {
        // fallback silently
      }
    }
  }, [task.output_path]);

  const isActive = task.status === 'downloading' || task.status === 'pending';
  const isPaused = task.status === 'paused';
  const isDone = task.status === 'done';
  const isFailed = task.status === 'failed';
  const badge = task.platform ? platformBadge[task.platform] : null;

  const cardClass = [
    'task-card',
    isDone ? 'done' : '',
    isFailed ? 'failed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const formatMeta = [
    task.format_note,
    task.file_size != null ? formatSize(task.downloaded_bytes, task.total_bytes ?? task.file_size) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <div className={cardClass}>
        <div className="task-thumb">
          {task.thumbnail ? (
            <img src={task.thumbnail} alt="" />
          ) : (
            <div className="task-thumb-placeholder" />
          )}
          {badge && (
            <span
              className="task-platform-badge"
              style={{ backgroundColor: badge.bg }}
            >
              {badge.label}
            </span>
          )}
        </div>

        <div className="task-info">
          <div className="task-title truncate" title={task.title ?? task.url}>
            {task.title || task.url}
          </div>
          <div className="task-meta text-muted">{formatMeta}</div>

          {(isActive || isPaused) && task.status_message && (
            <div className="task-status-msg">{task.status_message}</div>
          )}

          {(isActive || isPaused) && (
            <ProgressBar
              percent={task.progress_percent}
              speed={task.speed}
              eta={task.eta}
              compact={false}
            />
          )}

          {isDone && (
            <div className="task-status-done text-success">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4.5 7l2 2 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              已完成
            </div>
          )}

          {isFailed && task.error_message && (
            <div className="task-status-failed text-danger">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {task.error_message}
            </div>
          )}

          <div className="task-actions">
            {(isActive || isPaused) && (
              <>
                <button
                  className="btn-icon"
                  onClick={handlePauseResume}
                  disabled={actionLoading}
                  title={isPaused ? '恢复' : '暂停'}
                >
                  {isPaused ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 3l10 5-10 5V3z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="3" y="2" width="4" height="12" rx="1" />
                      <rect x="9" y="2" width="4" height="12" rx="1" />
                    </svg>
                  )}
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => setConfirmOpen(true)}
                  disabled={actionLoading}
                  title="取消"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </>
            )}
            {isDone && task.output_path && (
              <button className="btn-icon" onClick={handleCopyPath} title="复制路径">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="5" width="9" height="9" rx="1.5" />
                  <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v8a1 1 0 001 1h2" />
                </svg>
              </button>
            )}
            {isFailed && (
              <button
                className="btn-icon danger"
                onClick={() => setConfirmOpen(true)}
                title="删除"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 5h10M6 5V3h4v2M5 5v7a1 1 0 001 1h4a1 1 0 001-1V5" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="取消下载"
        message={`确定要取消 "${task.title || task.url}" 吗？`}
        confirmLabel="取消下载"
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
        danger
      />
    </>
  );
};

export default TaskCard;
