// frontend/src/components/DirectoryPicker.tsx
import { useState } from 'react';
import { api } from '../api/client';

interface Props {
  value: string;
  onSelect: (path: string) => void;
}

export default function DirectoryPicker({ value, onSelect }: Props) {
  const [current, setCurrent] = useState(value || '');
  const [picking, setPicking] = useState(false);

  const handleBrowse = async () => {
    setPicking(true);
    try {
      const result = await api.selectDirectory();
      if (result.path) {
        setCurrent(result.path);
        onSelect(result.path);
      }
    } catch {
      // dialog cancelled or failed
    } finally {
      setPicking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSelect(current);
    }
  };

  return (
    <div className="setting-input-group">
      <input
        type="text"
        className="mono-input"
        value={current}
        onChange={e => setCurrent(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSelect(current)}
        style={{ width: '340px' }}
        placeholder="例如: D:\downloads"
      />
      <button
        className="batch-btn"
        onClick={handleBrowse}
        disabled={picking}
      >
        {picking ? '选择中...' : '📂 浏览'}
      </button>
    </div>
  );
}
