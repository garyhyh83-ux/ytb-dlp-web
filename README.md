# yt-dlp Web

基于 [yt-dlp](https://github.com/yt-dlp/yt-dlp) 的在线视频下载 Web 界面。支持 YouTube 和 B站视频与播放列表下载。

## 功能

- 📥 **粘贴即下载** — 粘贴链接自动解析视频信息，选择画质后一键下载
- ⚡ **实时进度** — WebSocket 推送下载进度、速度、ETA
- 📋 **播放列表** — 自动拆分为独立任务，逐个下载并追踪整体进度
- 📂 **下载历史** — 缩略图网格浏览，搜索、筛选、分页
- ⏰ **定时任务** — 定时检查播放列表更新并自动下载新视频
- 🍪 **Cookie 管理** — 按平台导入 cookies.txt，下载会员/私享视频
- 🎬 **字幕支持** — 可选择手动字幕或自动生成字幕
- 🌙 **暗色主题** — 类 Transmission 下载管理器风格

## 技术栈

| 层 | 技术 |
|---|------|
| 后端 | Python FastAPI + yt-dlp + SQLite |
| 前端 | React + Vite + TypeScript |
| 实时 | WebSocket |

## 快速开始

### Windows

双击 `start.bat`，自动安装依赖并启动服务。

### macOS / Linux

```bash
chmod +x start.sh
./start.sh
```

### 手动启动

```bash
# 后端
cd backend && pip install -r requirements.txt && python main.py

# 前端 (开发模式，支持热更新)
cd frontend && npm install && npm run dev

# 前端 (生产模式)
cd frontend && npm run build
# 然后访问 http://localhost:8000
```

## 截图

打开浏览器访问 `http://localhost:3000`（开发模式）或 `http://localhost:8000`（生产模式）。

## License

MIT
