import React from 'react';

interface ProgressBarProps {
  percent: number;
  speed?: number | null;
  eta?: number | null;
  compact?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB/s`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB/s`;
  return `${bytes.toFixed(0)} B/s`;
}

function formatEta(seconds: number): string {
  if (seconds < 1) return '即将完成';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0 && s > 0) return `${m}分${s}秒`;
  if (m > 0) return `${m}分`;
  return `${s}秒`;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  speed = null,
  eta = null,
  compact = false,
}) => {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="progress-wrapper">
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {!compact && (
        <div className="progress-meta">
          <span className="progress-pct text-mono">{clamped.toFixed(1)}%</span>
          {speed != null && (
            <span className="progress-speed text-muted">{formatBytes(speed)}</span>
          )}
          {eta != null && (
            <span className="progress-eta text-muted">{formatEta(eta)}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
