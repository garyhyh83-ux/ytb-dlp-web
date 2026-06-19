// frontend/src/components/StatusBar.tsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface StatusBarProps {
  connected: boolean;
  activeCount: number;
}

export default function StatusBar({ connected, activeCount }: StatusBarProps) {
  const [version, setVersion] = useState<string>('…');
  const [diskFree, setDiskFree] = useState<string>('…');

  useEffect(() => {
    const fetchStats = () => {
      api.getStats()
        .then((data) => {
          if (data.ytdlp_version) setVersion(`yt-dlp v${data.ytdlp_version}`);
          if (data.disk_free_gb !== undefined) {
            setDiskFree(`${data.disk_free_gb.toFixed(1)} GB free`);
          }
        })
        .catch(() => {
          setVersion('--');
          setDiskFree('--');
        });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="statusbar">
      <div className="statusbar-segment">
        <span className={`statusbar-dot ${connected ? 'online' : 'offline'}`} />
        <span>{connected ? '已连接' : '未连接'}</span>
      </div>
      <span className="statusbar-divider" />
      <div className="statusbar-segment">
        <span>下载中</span>
        <span>{activeCount}</span>
      </div>
      <span className="statusbar-divider" />
      <div className="statusbar-segment">
        <span>{diskFree}</span>
      </div>
      <span className="statusbar-spacer" />
      <div className="statusbar-segment">
        <span>{version}</span>
      </div>
    </footer>
  );
}
