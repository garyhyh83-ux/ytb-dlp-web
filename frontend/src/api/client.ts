// frontend/src/api/client.ts

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  parse: (url: string) =>
    request<any>('/parse', { method: 'POST', body: JSON.stringify({ url }) }),

  createDownload: (url: string, formatId?: string, subtitleLang?: string) =>
    request<{ task_id: string }>('/download', {
      method: 'POST',
      body: JSON.stringify({ url, format_id: formatId, subtitle_lang: subtitleLang }),
    }),

  getDownloads: (status?: string) =>
    request<{ tasks: any[] }>(`/downloads${status ? `?status=${status}` : ''}`),

  getTask: (id: string) => request<any>(`/downloads/${id}`),

  pauseTask: (id: string) =>
    request<any>(`/downloads/${id}/pause`, { method: 'POST' }),

  resumeTask: (id: string) =>
    request<any>(`/downloads/${id}/resume`, { method: 'POST' }),

  deleteTask: (id: string) =>
    request<any>(`/downloads/${id}`, { method: 'DELETE' }),

  pauseAll: () =>
    request<any>('/downloads/pause-all', { method: 'POST' }),

  resumeAll: () =>
    request<any>('/downloads/resume-all', { method: 'POST' }),

  getHistory: (params: {
    search?: string;
    platform?: string;
    sort?: string;
    page?: number;
    per_page?: number;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return request<any>(`/history?${qs.toString()}`);
  },

  getPlaylists: () => request<{ playlists: any[] }>('/playlists'),

  getSettings: () => request<Record<string, string>>('/settings'),

  updateSettings: (data: Record<string, string>) =>
    request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  uploadCookie: async (platform: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/settings/cookie?platform=${platform}`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  getStats: () => request<any>('/stats'),

  browseDirectories: (path?: string) =>
    request<{ path: string; entries: { name: string; path: string }[] }>(
      `/browse${path ? `?path=${encodeURIComponent(path)}` : ''}`
    ),

  getScheduledJobs: () => request<{ jobs: any[] }>('/scheduled-jobs'),

  createScheduledJob: (playlistUrl: string, cronExpr: string) =>
    request<any>('/scheduled-jobs', {
      method: 'POST',
      body: JSON.stringify({ playlist_url: playlistUrl, cron_expr: cronExpr }),
    }),

  deleteScheduledJob: (id: string) =>
    request<any>(`/scheduled-jobs/${id}`, { method: 'DELETE' }),
};
