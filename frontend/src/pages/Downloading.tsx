// frontend/src/pages/Downloading.tsx
import type { Task } from '../types';
import TaskCard from '../components/TaskCard';
import { api } from '../api/client';

interface Props {
  tasks: Task[];
}

export default function Downloading({ tasks }: Props) {
  const hasActive = tasks.some(t => t.status === 'downloading');

  return (
    <div>
      <div className="page-header">
        <h2>下载中</h2>
        <p>{tasks.length} 个任务</p>
      </div>

      {tasks.length > 0 && (
        <div className="batch-actions">
          {hasActive ? (
            <button className="batch-btn" onClick={() => api.pauseAll()}>
              ⏸ 全部暂停
            </button>
          ) : (
            <button className="batch-btn" onClick={() => api.resumeAll()}>
              ▶ 全部开始
            </button>
          )}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📥</div>
          <p>暂无下载任务</p>
          <span>前往"新建下载"添加任务</span>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
