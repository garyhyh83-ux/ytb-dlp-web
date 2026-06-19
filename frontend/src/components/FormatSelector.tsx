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
}

const PRESETS: PresetOption[] = [
  { id: 'best-4k', label: '最佳画质 (4K)' },
  { id: 'best-1080p', label: '最佳 (1080p)' },
  { id: 'audio-only', label: '仅音频 (MP3)' },
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

function isAudioOnly(f: FormatInfo): boolean {
  return f.acodec !== 'none' && f.vcodec === 'none';
}

function isVideoAudio(f: FormatInfo): boolean {
  return f.vcodec !== 'none' && f.acodec !== 'none';
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
  formats,
  selected,
  onSelect,
}) => {
  const presetFormatIds = useMemo(() => {
    const result: Record<string, string | null> = {};

    // Best 4K: height >= 2160, prefer video+audio, sort by height desc
    const fourK = formats
      .filter((f) => f.height != null && f.height >= 2160 && f.vcodec !== 'none')
      .sort((a, b) => {
        const va = isVideoAudio(a) ? 1 : 0;
        const vb = isVideoAudio(b) ? 1 : 0;
        if (va !== vb) return vb - va;
        return (b.height ?? 0) - (a.height ?? 0);
      });
    result['best-4k'] = fourK.length > 0 ? fourK[0].format_id : null;

    // Best 1080p: height <= 1080, prefer video+audio, sort by height desc
    const fhd = formats
      .filter((f) => f.height != null && f.height <= 1080 && f.vcodec !== 'none')
      .sort((a, b) => {
        const va = isVideoAudio(a) ? 1 : 0;
        const vb = isVideoAudio(b) ? 1 : 0;
        if (va !== vb) return vb - va;
        return (b.height ?? 0) - (a.height ?? 0);
      });
    result['best-1080p'] = fhd.length > 0 ? fhd[0].format_id : null;

    // Audio only
    const audio = formats.find((f) => isAudioOnly(f));
    result['audio-only'] = audio?.format_id ?? null;

    return result;
  }, [formats]);

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
      ? '→ 自动选择'
      : (() => {
          const preset = PRESETS.find((p) => presetFormatIds[p.id] === selected);
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
        {PRESETS.map((preset) => {
          const fid = presetFormatIds[preset.id];
          const isDisabled = fid === null;
          return (
            <button
              key={preset.id}
              className={`format-preset ${selected === fid ? 'active' : ''}`}
              onClick={() => fid !== null && onSelect(fid)}
              disabled={isDisabled}
              title={isDisabled ? '无可用格式' : preset.label}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="format-summary text-secondary">
        {currentSelectedLabel}
      </div>

      <details className="format-list-wrapper">
        <summary className="format-list-summary">
          所有格式 ({uniqueFormats.length})
        </summary>
        <div className="format-list">
          {uniqueFormats.map((f) => (
            <button
              key={f.format_id}
              className={`format-option ${selected === f.format_id ? 'active' : ''}`}
              onClick={() => onSelect(f.format_id)}
            >
              <span className="format-option-id text-mono">{f.format_id}</span>
              <span className="format-option-label">{formatLabel(f)}</span>
            </button>
          ))}
        </div>
      </details>
    </div>
  );
};

export default FormatSelector;
