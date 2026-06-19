// frontend/src/components/DirectoryPicker.tsx
import { useState, useEffect, useRef } from 'react';
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
}

export default function DirectoryPicker({ value, onSelect }: Props) {
  const [currentPath, setCurrentPath] = useState(value || '');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    if (showPanel) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPanel]);

  const fetchPath = async (p: string) => {
    setLoading(true);
    try {
      const data = await api.browseDirectories(p || undefined);
      setCurrentPath(data.path);
      setEntries(data.entries);
    } catch {
      // keep current view
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setShowPanel(true);
    fetchPath(currentPath || value || '');
  };

  const handleClick = (entry: Entry) => {
    setCurrentPath(entry.path);
    fetchPath(entry.path);
  };

  const handleSelect = () => {
    onSelect(currentPath);
    setShowPanel(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSelect(currentPath);
      setShowPanel(false);
    }
  };

  return (
    <div className="dir-picker" ref={panelRef}>
      <div className="setting-input-group">
        <input
          ref={inputRef}
          type="text"
          className="mono-input"
          value={currentPath}
          onChange={e => setCurrentPath(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!showPanel) fetchPath(currentPath || '');
            setShowPanel(true);
          }}
          style={{ width: '340px' }}
        />
        <button className="batch-btn" onClick={handleOpen}>
          📂 浏览
        </button>
      </div>

      {showPanel && (
        <div className="dir-picker-panel">
          <div className="dir-picker-path-bar">
            <span className="dir-picker-path-text">
              {currentPath || '此电脑'}
            </span>
          </div>

          <div className="dir-picker-list">
            {loading && (
              <div className="dir-picker-loading">加载中...</div>
            )}
            {!loading && entries.map(e => (
              <div
                key={e.path}
                className={`dir-picker-entry ${e.is_parent ? 'is-parent' : ''} ${e.is_drive ? 'is-drive' : ''}`}
                onClick={() => handleClick(e)}
              >
                <span className="dir-picker-icon">
                  {e.is_parent ? '↩' : e.is_drive ? '💾' : '📁'}
                </span>
                <span className="dir-picker-name">{e.name}</span>
              </div>
            ))}
            {!loading && entries.length === 0 && (
              <div className="dir-picker-loading">此目录为空</div>
            )}
          </div>

          <div className="dir-picker-actions">
            <button className="btn-confirm" onClick={handleSelect}>
              ✓ 选择此目录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
