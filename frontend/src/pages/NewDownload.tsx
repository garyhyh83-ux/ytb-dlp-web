// frontend/src/pages/NewDownload.tsx
import UrlInput from '../components/UrlInput';

export default function NewDownload() {
  return (
    <div className="page-new-download">
      <div className="page-header">
        <h2>新建下载</h2>
        <p>粘贴 YouTube 或 B站 的视频链接开始下载</p>
      </div>
      <UrlInput />
    </div>
  );
}
