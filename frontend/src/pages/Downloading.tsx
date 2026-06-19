// frontend/src/pages/Downloading.tsx
import type { Task } from '../types';

interface Props {
  tasks: Task[];
}

export default function Downloading({ tasks: _tasks }: Props) {
  return <div className="page-placeholder">下载中</div>;
}
