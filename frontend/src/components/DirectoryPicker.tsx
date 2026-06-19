// frontend/src/components/DirectoryPicker.tsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface Entry {
  name: string;
  path: string;
  is_parent?: boolean;
  is_drive?: boolean;
}

interface Props {
  value: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}

export default function DirectoryPicker({ value, onSelect, onClose }: Props) {
  const [currentPath, setCurrentPath] = useState(value || '');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPath = async (p: string) => {
    setLoading(true);
    try {
      const data = await api.browseDirectories(p || undefined);
      setCurrentPath(data.path);
      setEntries(data.entries);
    } catch {
      // stay on current view
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPath(value || '');
  }, []);

  const handleClick = (entry: Entry) => {
    fetchPath(entry.path);
  };

  const handleSelect = () => {
    onSelect(currentPath);
    onClose();
  };

  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div className="dialog dir-picker-dialog">
        <div className="dialog-title">选择下载目录</div>

        <div className="dir-picker-path">
          <span className="dir-picker-path-text">{currentPath || '此电脑'}</span>
        </div>

        <div className="dir-picker-list">
          {loading && <div className="dir-picker-loading">加载中...</div>}
          {!loading && entries.map(e => (
            <button
              key={e.path}
              className={`dir-picker-entry ${e.is_parent ? 'is-parent' : ''} ${e.is_drive ? 'is-drive' : ''}`}
              onClick={() => handleClick(e)}
            >
              <span className="dir-picker-icon">
                {e.is_parent ? '↩' : e.is_drive ? '💾' : '📁'}
              </span>
              <span className="dir-picker-name">{e.name}</span>
            </button>
          ))}
        </div>

        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-confirm" onClick={handleSelect}>
            ✓ 选择此目录
          </button>
        </div>
      </div>
    </>
  );
}
