// frontend/src/pages/Settings.tsx
import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import DirectoryPicker from '../components/DirectoryPicker';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [cookiePlatform, setCookiePlatform] = useState('youtube');
  const [cookieStatus, setCookieStatus] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [scheduledJobs, setScheduledJobs] = useState<any[]>([]);
  const [scheduledUrl, setScheduledUrl] = useState('');
  const [scheduledCron, setScheduledCron] = useState('daily');
  const [showDirPicker, setShowDirPicker] = useState(false);

  const fetchScheduledJobs = () => {
    api.getScheduledJobs().then(d => setScheduledJobs(d.jobs));
  };

  useEffect(() => {
    api.getSettings().then(setSettings);
    fetchScheduledJobs();
  }, []);

  const handleSave = async (key: string, value: string) => {
    await api.updateSettings({ [key]: value });
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleCookieUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await api.uploadCookie(cookiePlatform, file);
    setCookieStatus(prev => ({ ...prev, [cookiePlatform]: `已导入: ${file.name}` }));
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>设置</h2>
      </div>

      {/* General */}
      <section className="settings-section">
        <h3>通用</h3>

        <div className="setting-row">
          <label>下载目录</label>
          <div className="setting-input-group">
            <input
              type="text"
              value={settings.download_dir || 'downloads'}
              onChange={e => setSettings({ ...settings, download_dir: e.target.value })}
              onBlur={() => handleSave('download_dir', settings.download_dir)}
              style={{ width: '280px' }}
            />
            <button className="batch-btn" onClick={() => setShowDirPicker(true)}>
              📂 浏览
            </button>
          </div>
        </div>

        <div className="setting-row">
          <label>并发下载数</label>
          <select
            value={settings.concurrency || '3'}
            onChange={e => handleSave('concurrency', e.target.value)}
          >
            {[1,2,3,4,5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="setting-row">
          <label>文件名模板</label>
          <div className="setting-input-group">
            <input
              type="text"
              value={settings.filename_template || '%(title)s.%(ext)s'}
              onChange={e => setSettings({ ...settings, filename_template: e.target.value })}
              onBlur={() => handleSave('filename_template', settings.filename_template)}
              style={{ width: '400px' }}
              className="mono-input"
            />
            <span className="setting-hint">yt-dlp output template 格式</span>
          </div>
        </div>
      </section>

      {/* Cookies */}
      <section className="settings-section">
        <h3>Cookie 管理</h3>

        <div className="setting-row">
          <label>平台</label>
          <select value={cookiePlatform} onChange={e => setCookiePlatform(e.target.value)}>
            <option value="youtube">YouTube</option>
            <option value="bilibili">B站</option>
          </select>
        </div>

        <div className="setting-row">
          <label>导入 cookies.txt</label>
          <div className="setting-input-group">
            <input ref={fileRef} type="file" accept=".txt" />
            <button className="batch-btn" onClick={handleCookieUpload}>📎 上传</button>
            {cookieStatus[cookiePlatform] && (
              <span className="cookie-status">● {cookieStatus[cookiePlatform]}</span>
            )}
          </div>
        </div>
      </section>

      {/* Scheduled Jobs */}
      <section className="settings-section">
        <h3>定时任务</h3>

        {scheduledJobs.map((job: any) => (
          <div key={job.id} className="setting-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.playlist_url}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {job.cron_expr === 'daily' ? '每天' : job.cron_expr === 'hourly' ? '每小时' : job.cron_expr}
                {job.last_run ? ` · 上次: ${job.last_run}` : ' · 未运行'}
              </div>
            </div>
            <button
              className="btn-icon danger"
              onClick={() => {
                api.deleteScheduledJob(job.id).then(fetchScheduledJobs);
              }}
            >
              ✕
            </button>
          </div>
        ))}

        <div className="setting-row" style={{ marginTop: '12px' }}>
          <input
            type="text"
            placeholder="播放列表 URL"
            value={scheduledUrl}
            onChange={e => setScheduledUrl(e.target.value)}
            style={{ flex: 1 }}
          />
          <select value={scheduledCron} onChange={e => setScheduledCron(e.target.value)}>
            <option value="daily">每天</option>
            <option value="hourly">每小时</option>
          </select>
          <button
            className="batch-btn"
            onClick={async () => {
              if (!scheduledUrl.trim()) return;
              await api.createScheduledJob(scheduledUrl, scheduledCron);
              setScheduledUrl('');
              fetchScheduledJobs();
            }}
          >
            + 添加
          </button>
        </div>
      </section>

      {/* About */}
      <section className="settings-section">
        <h3>关于</h3>
        <div className="setting-row">
          <label>版本</label>
          <span className="text-muted">0.1.0</span>
        </div>
      </section>

      {showDirPicker && (
        <DirectoryPicker
          value={settings.download_dir || 'downloads'}
          onSelect={async (path) => {
            await handleSave('download_dir', path);
            setShowDirPicker(false);
          }}
          onClose={() => setShowDirPicker(false)}
        />
      )}
    </div>
  );
}
