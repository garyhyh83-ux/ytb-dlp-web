# yt-dlp Web 视频下载系统 — 设计规格书

**日期**: 2026-06-19  
**状态**: 已确认  
**用户**: 个人自用

---

## 1. 项目概述

基于 yt-dlp 的在线视频下载 Web 界面系统。个人自用工具，部署在本地/ NAS 上，支持 YouTube 和 B站两个平台的视频与播放列表下载。

### 核心目标
- 粘贴链接 → 解析视频信息 → 选择格式 → 下载，全程流畅
- 实时进度反馈，支持暂停/恢复
- 下载历史管理，可搜索、可浏览
- 播放列表批量下载 + 定时自动检查更新
- 支持 cookie 管理、字幕选择

---

## 2. 技术架构

| 层 | 选型 | 理由 |
|---|------|------|
| 后端 | Python FastAPI | yt-dlp 原生 Python 库，直接调用 API，无需子进程；内置 WebSocket 支持实时进度推送 |
| 前端 | React + Vite + TypeScript | 组件化构建列表、卡片、进度条等交互丰富的 UI |
| 数据库 | SQLite | 零配置，单文件，足够个人使用 |
| 实时通信 | WebSocket | 下载进度实时推送到前端 |
| 异步 | asyncio | FastAPI 原生异步 + Semaphore 控制并发下载 |
| 部署 | `uvicorn` 直接跑 + Docker 可选 | 满足 Windows 和 Docker 两种部署方式 |

---

## 3. 页面布局

### 整体结构

```
┌──────────────────────────────────────────┐
│  LOGO    yt-dlp Web    [⚙ 设置]         │  ← 顶栏 (48px)
├────────────┬─────────────────────────────┤
│ 📥 新建下载 │  ┌─────────────────────────┐│
│ ⚡ 下载中   │  │                         ││
│ ✅ 已完成   │  │      主内容区            ││
│ 📋 播放列表 │  │                         ││
│            │  │                         ││
│            │  └─────────────────────────┘│
├────────────┴─────────────────────────────┤
│  🟢 空闲  | 磁盘: 120GB 可用             │  ← 状态栏 (28px)
└──────────────────────────────────────────┘
```

- 左侧导航 (200px)：固定宽度，图标+文字，暗色背景，带数字角标
- 右侧主区域：弹性宽度，内容卡片视图
- 顶栏：极薄，标题 + 设置入口
- 底部状态栏：一行，引擎状态 + 磁盘空间

### 视觉风格
- 暗色主题
- 简洁实用，类似 Transmission/qBittorrent Web UI 的专业工具感
- 信息密度适中，操作路径短

---

## 4. 核心页面

### 4.1 新建下载

- URL 输入框为核心入口，支持粘贴单条或多条 URL
- 粘贴后自动解析：展示视频标题、封面缩略图、时长、可用格式列表
- 格式选择用智能简写：最佳画质 (4K)、最佳 (1080p)、仅音频 (MP3)、自定义
- 字幕选择：手动字幕/自动字幕 + 语言
- 两个操作按钮：立即下载 / 加入定时队列

### 4.2 下载中

- 每个任务一张紧凑卡片
- 进度条 + 实时速度 + ETA + 已下载/总量
- 显示平台标签、画质、文件大小
- 支持单任务暂停/恢复/取消
- 批量操作：全部暂停/全部开始
- 完成时绿色脉冲动画，自动移至"已完成"

### 4.3 已完成

- 卡片网格布局（3-4 列），带视频缩略图
- 支持搜索标题、按平台筛选、按时间排序
- 点击卡片：右侧滑入详情面板（完整元数据、下载参数、本地路径、打开文件夹）
- 分页加载

### 4.4 播放列表

- 独立列表视图
- 每个播放列表一张卡片，显示完成进度 (12/24, 50%)
- 展开查看每个视频的下载状态（已完成/下载中/等待中）
- 支持全部暂停/继续

### 4.5 设置

- 通用：下载目录、并发数、文件名模板
- Cookie 管理：按平台导入 cookies.txt，显示配置状态
- 定时任务：管理自动检查播放列表更新的定时规则

---

## 5. API 设计

```
POST   /api/parse             # 解析 URL → 视频元数据
POST   /api/download          # 创建下载任务
GET    /api/downloads         # 任务列表（筛选：进行中/已完成/播放列表）
GET    /api/downloads/:id     # 单个任务详情
POST   /api/downloads/:id/pause
POST   /api/downloads/:id/resume
DELETE /api/downloads/:id      # 取消/删除
WS     /api/ws                # 实时推送所有任务进度
GET    /api/history           # 已完成历史（分页+搜索+筛选）
GET    /api/playlists         # 播放列表状态
GET    /api/settings          # 读取配置
PUT    /api/settings          # 更新配置
POST   /api/settings/cookie   # 上传 cookie 文件
GET    /api/stats             # 系统信息
```

---

## 6. 数据模型 (SQLite)

```sql
tasks (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  thumbnail TEXT,
  platform TEXT,              -- 'youtube' | 'bilibili'
  format_id TEXT,
  format_note TEXT,           -- '1080p60', 'best' etc.
  status TEXT DEFAULT 'pending',  -- pending/downloading/paused/done/failed
  progress_percent REAL DEFAULT 0,
  downloaded_bytes INTEGER DEFAULT 0,
  total_bytes INTEGER,
  speed REAL,
  eta INTEGER,
  output_path TEXT,
  file_size INTEGER,
  playlist_id TEXT REFERENCES playlists(id),
  playlist_index INTEGER,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)

playlists (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  thumbnail TEXT,
  platform TEXT,
  total_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'downloading',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)

settings (
  key TEXT PRIMARY KEY,
  value TEXT
)
```

---

## 7. yt-dlp 集成

- 直接 `import yt_dlp`，使用 Python API
- 解析阶段：`extract_info(url, download=False)` 获取元数据
- 下载阶段：`progress_hooks` 回调 → WebSocket 推送
- 并发控制：`asyncio.Semaphore`（默认并发数 3）
- Cookie：按平台存储 cookie 文件，下载时传入对应路径

---

## 8. 非功能需求

- **部署**：Windows 直接跑 `uvicorn` + Docker 容器化两种方式
- **网络**：系统不内置代理功能，网络层由用户自行解决
- **性能**：支持 3 个并发下载任务，历史记录支持分页
- **数据持久化**：SQLite 单文件，与下载目录隔离
