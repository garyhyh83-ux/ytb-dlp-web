// frontend/src/pages/Completed.tsx
import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import { api } from '../api/client';
import VideoCard from '../components/VideoCard';
import DetailPanel from '../components/DetailPanel';

export default function Completed() {
  const [items, setItems] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchHistory = useCallback(async () => {
    const data = await api.getHistory({ search: search || undefined, platform: platform || undefined, sort, page });
    setItems(data.items);
    setTotal(data.total);
  }, [search, platform, sort, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.ceil(total / 24);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>已完成</h2>
            <p>{total} 个视频</p>
          </div>
          <button
            className="batch-btn"
            style={{ color: 'var(--danger)' }}
            disabled={total === 0}
            onClick={() => {
              if (window.confirm('确定要清除所有已完成记录吗？此操作不可撤销。')) {
                api.clearHistory().then(() => fetchHistory());
              }
            }}
          >
            🗑 清除所有记录
          </button>
        </div>
      </div>

      <div className="history-filters">
        <input
          type="text"
          placeholder="搜索标题..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="filter-search"
        />
        <select value={platform} onChange={e => { setPlatform(e.target.value); setPage(1); }}>
          <option value="">全部平台</option>
          <option value="youtube">YouTube</option>
          <option value="bilibili">B站</option>
        </select>
        <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
          <option value="recent">最近</option>
          <option value="size">大小</option>
          <option value="title">标题</option>
        </select>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>暂无已完成的下载</p>
        </div>
      ) : (
        <>
          <div className="video-grid">
            {items.map(task => (
              <VideoCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← 上一页</button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页 →</button>
            </div>
          )}
        </>
      )}

      <DetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}
