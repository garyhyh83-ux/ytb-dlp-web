import React, { useState, useCallback, useRef, useEffect } from 'react';
import { VideoInfo } from '../types';
import { api } from '../api/client';
import FormatSelector from './FormatSelector';

interface UrlInputProps {
  onCreated?: (taskId: string) => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const platformBadge: Record<string, { label: string; bg: string }> = {
  youtube: { label: 'YT', bg: '#ff4444' },
  bilibili: { label: 'B站', bg: '#fb7299' },
};

const UrlInput: React.FC<UrlInputProps> = ({ onCreated }) => {
  const [url, setUrl] = useState('');
  const [parsing, setParsing] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [subtitleLang, setSubtitleLang] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    inputRef.current?.focus();
  }, []);

  const handleParse = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setError(null);
    setParsing(true);
    setVideoInfo(null);
    setSelectedFormat(null);
    setSubtitleLang('');

    try {
      const info: VideoInfo = await api.parse(trimmed);
      setVideoInfo(info);
      // Auto-select the first format as default (none means auto)
      setSelectedFormat(null);
    } catch (err: any) {
      setError(err.message || '解析失败');
      setVideoInfo(null);
    } finally {
      setParsing(false);
    }
  }, [url]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleParse();
      }
    },
    [handleParse],
  );

  const handleDownload = useCallback(async () => {
    if (!videoInfo) return;

    setDownloading(true);
    setError(null);

    try {
      const result = await api.createDownload(
        videoInfo.webpage_url,
        selectedFormat || undefined,
        subtitleLang || undefined,
      );
      onCreated?.(result.task_id);
      // Clear form
      setUrl('');
      setVideoInfo(null);
      setSelectedFormat(null);
      setSubtitleLang('');
      setError(null);
    } catch (err: any) {
      setError(err.message || '创建下载失败');
    } finally {
      setDownloading(false);
    }
  }, [videoInfo, selectedFormat, subtitleLang, onCreated]);

  const badge = videoInfo ? platformBadge[videoInfo.platform] ?? null : null;

  const availableSubtitleLangs = videoInfo?.subtitles
    ? Object.keys(videoInfo.subtitles).filter(
        (k) => videoInfo.subtitles[k].length > 0,
      )
    : [];

  return (
    <div className="url-input-section">
      <div className="url-input-wrapper">
        <textarea
          ref={inputRef as any}
          className="url-input"
          placeholder="粘贴视频链接 (YouTube / B站)，支持多行批量粘贴"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={parsing}
        />
        <button
          className="btn-primary"
          onClick={handleParse}
          disabled={parsing || !url.trim()}
        >
          {parsing ? (
            <>
              <svg className="spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="8 30" strokeLinecap="round" />
              </svg>
              解析中...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5 3l8 5-8 5V3z" />
              </svg>
              解析
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="url-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M8 1l7 13H1L8 1zM8 6v3M8 11v1" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {videoInfo && (
        <div className="parse-result fade-in">
          <div className="parse-header">
            {videoInfo.thumbnail && (
              <div className="parse-thumb">
                <img src={videoInfo.thumbnail} alt="" />
                {badge && (
                  <span
                    className="parse-platform"
                    style={{ backgroundColor: badge.bg }}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
            )}
            <div className="parse-info">
              <div className="parse-title">{videoInfo.title}</div>
              <div className="parse-meta text-secondary">
                {formatDuration(videoInfo.duration)}
                {videoInfo.is_playlist && videoInfo.playlist_title && (
                  <span>
                    {' · '}播放列表: {videoInfo.playlist_title}
                    {videoInfo.playlist_count != null && ` (${videoInfo.playlist_count}项)`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <FormatSelector
            formats={videoInfo.formats}
            selected={selectedFormat}
            onSelect={setSelectedFormat}
          />

          {availableSubtitleLangs.length > 0 && (
            <div className="subtitle-select">
              <label>字幕语言:</label>
              <select
                value={subtitleLang}
                onChange={(e) => setSubtitleLang(e.target.value)}
              >
                <option value="">不下载字幕</option>
                {availableSubtitleLangs.map((lang) => (
                  <option key={lang} value={lang}>
                    {videoInfo.subtitles[lang][0]?.name || lang}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="btn-download btn-primary"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <svg className="spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="8 30" strokeLinecap="round" />
                </svg>
                创建下载中...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1v10M4 7l4 4 4-4M2 13v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
                立即下载
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default UrlInput;
