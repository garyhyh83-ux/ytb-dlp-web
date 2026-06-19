// frontend/src/pages/Playlists.tsx
import { useState, useEffect } from 'react';
import type { Playlist } from '../types';
import { api } from '../api/client';
import PlaylistCard from '../components/PlaylistCard';

export default function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    api.getPlaylists().then(data => setPlaylists(data.playlists));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>播放列表</h2>
        <p>{playlists.length} 个列表</p>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>暂无播放列表下载</p>
          <span>在"新建下载"中粘贴播放列表链接即可开始</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {playlists.map(p => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </div>
      )}
    </div>
  );
}
