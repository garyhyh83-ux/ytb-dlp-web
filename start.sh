#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     yt-dlp Web 视频下载系统 v0.1.0       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 检查依赖 ──────────────────────────────────
if ! python -c "import fastapi, yt_dlp, aiosqlite" 2>/dev/null; then
    echo "[!] 正在安装后端依赖..."
    pip install -r backend/requirements.txt
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "[!] 正在安装前端依赖..."
    cd frontend && npm install && cd ..
fi

# ── 清理旧进程 ──────────────────────────────────
cleanup() {
    echo ""
    echo "[!] 正在停止服务..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo "[✓] 服务已停止"
}
trap cleanup EXIT INT TERM

# ── 启动后端 ──────────────────────────────────
echo "[✓] 启动后端服务 (端口 8000)..."
cd "$SCRIPT_DIR/backend"
python main.py &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# ── 等待后端就绪 ──────────────────────────────
echo "[ ] 等待后端就绪..."
until curl -s http://localhost:8000/api/stats > /dev/null 2>&1; do
    sleep 1
done
echo "[✓] 后端就绪"

# ── 启动前端 ──────────────────────────────────
echo "[✓] 启动前端服务 (端口 3000)..."
cd "$SCRIPT_DIR/frontend"
npx vite --port 3000 &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# ── 等待前端就绪 ──────────────────────────────
echo "[ ] 等待前端就绪..."
until curl -s http://localhost:3000 > /dev/null 2>&1; do
    sleep 1
done
echo "[✓] 前端就绪"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  服务已启动                              ║"
echo "║  前端: http://localhost:3000             ║"
echo "║  API:  http://localhost:8000/docs        ║"
echo "║  按 Ctrl+C 停止所有服务                  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# 打开浏览器
if command -v explorer.exe &> /dev/null; then
    explorer.exe "http://localhost:3000"
elif command -v open &> /dev/null; then
    open "http://localhost:3000"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000"
fi

# 等待子进程
wait
