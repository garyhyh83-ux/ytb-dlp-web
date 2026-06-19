// frontend/src/components/DetailPanel.tsx
import type { Task } from '../types';

interface Props {
  task: Task | null;
  onClose: () => void;
}

export default function DetailPanel({ task, onClose }: Props) {
  if (!task) return null;

  const details = [
    ['平台', task.platform],
    ['画质', task.format_note],
    ['格式 ID', task.format_id],
    ['状态', task.status],
    ['文件大小', task.file_size ? `${(task.file_size / 1_000_000).toFixed(0)} MB` : '—'],
    ['本地路径', task.output_path || '—'],
    ['URL', task.url],
    ['创建时间', task.created_at],
    ['完成时间', task.updated_at],
    ['错误信息', task.error_message],
  ].filter(([, v]) => v != null);

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <div className="detail-panel">
        <div className="detail-header">
          <h3>任务详情</h3>
          <button className="detail-close" onClick={onClose}>✕</button>
        </div>

        {task.thumbnail && (
          <img src={task.thumbnail} alt="" className="detail-thumb" />
        )}

        <h4 className="detail-title">{task.title || '未知'}</h4>

        <dl className="detail-list">
          {details.map(([label, value]) => (
            <div key={label} className="detail-row">
              <dt>{label}</dt>
              <dd title={String(value)}>{String(value)}</dd>
            </div>
          ))}
        </dl>

        {task.output_path && (
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
            onClick={() => navigator.clipboard.writeText(task.output_path!)}
          >
            📋 复制文件路径
          </button>
        )}
      </div>
    </>
  );
}
