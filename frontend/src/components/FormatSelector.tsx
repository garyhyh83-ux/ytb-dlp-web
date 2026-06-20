import React, { useMemo } from 'react';
import { FormatInfo } from '../types';

interface FormatSelectorProps {
  formats: FormatInfo[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

interface PresetOption {
  id: string;
  label: string;
  formatSelector: string;  // yt-dlp format selector, always includes audio
}

const PRESETS: PresetOption[] = [
  { id: 'best-4k', label: '最佳画质 (4K)', formatSelector: 'bestvideo[height<=2160]+bestaudio/best[height<=2160]' },
  { id: 'best-1080p', label: '最佳 (1080p)', formatSelector: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]' },
  { id: 'audio-only', label: '仅音频 (MP3)', formatSelector: 'bestaudio/best' },
];

function formatSizeMB(bytes: number | null): string {
  if (bytes == null) return '?MB';
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)}GB`;
  return `${(bytes / 1_000_000).toFixed(0)}MB`;
}

function formatLabel(f: FormatInfo): string {
  const parts = [
    f.resolution || f.format_note || null,
    f.format_note && f.format_note !== f.resolution ? f.format_note : null,
    f.ext?.toUpperCase(),
    f.filesize != null ? formatSizeMB(f.filesize) : null,
  ];
  return parts.filter(Boolean).join(' · ');
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
  formats,
  selected,
  onSelect,
}) => {
  // Deduplicate formats by format_id for the expanded list
  const uniqueFormats = useMemo(() => {
    const seen = new Set<string>();
    return formats.filter((f) => {
      if (seen.has(f.format_id)) return false;
      seen.add(f.format_id);
      return true;
    });
  }, [formats]);

  const currentSelectedLabel =
    selected === null
      ? '自动选择'
      : (() => {
          const preset = PRESETS.find((p) => p.formatSelector === selected);
          if (preset) return preset.label;
          const fmt = uniqueFormats.find((f) => f.format_id === selected);
          return fmt ? formatLabel(fmt) : selected;
        })();

  return (
    <div className="format-selector">
      <div className="format-presets">
        <button
          className={`format-preset ${selected === null ? 'active' : ''}`}
          onClick={() => onSelect(null)}
        >
          自动
        </button>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={`format-preset ${selected === preset.formatSelector ? 'active' : ''}`}
            onClick={() => onSelect(preset.formatSelector)}
            title={preset.label}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="format-summary text-secondary">
        {currentSelectedLabel}
      </div>

      <details className="format-details">
        <summary className="format-summary">自定义格式 ({uniqueFormats.length})</summary>
        <div className="format-list">
          {uniqueFormats.map((f) => (
            <button
              key={f.format_id}
              className={`format-option ${selected === f.format_id ? 'active' : ''}`}
              onClick={() => onSelect(f.format_id)}
            >
              {formatLabel(f)}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
};

export default FormatSelector;
