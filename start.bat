@echo off
chcp 65001 >nul
title yt-dlp Web 启动器

echo.
echo ╔══════════════════════════════════════════╗
echo ║     yt-dlp Web 视频下载系统 v0.1.0       ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM ── 检查 Python ──────────────────────────────
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [✕] 未找到 Python，请先安装 Python 3.11+
    pause
    exit /b 1
)

REM ── 检查依赖 ──────────────────────────────────
python -c "import fastapi, yt_dlp, aiosqlite" 2>nul
if %errorlevel% neq 0 (
    echo [!] 正在安装后端依赖...
    cd backend
    pip install -r requirements.txt
    cd ..
)

REM ── 检查前端依赖 ──────────────────────────────
if not exist "frontend\node_modules" (
    echo [!] 正在安装前端依赖...
    cd frontend
    call npm install
    cd ..
)

REM ── 启动后端 ──────────────────────────────────
echo [✓] 启动后端服务 (端口 8000)...
start "yt-dlp Backend" cmd /k "cd /d %~dp0backend && python main.py"

REM ── 等待后端就绪 ──────────────────────────────
echo [ ] 等待后端就绪...
:wait_backend
timeout /t 1 /nobreak >nul
curl -s http://localhost:8000/api/stats >nul 2>nul
if %errorlevel% neq 0 goto wait_backend
echo [✓] 后端就绪

REM ── 启动前端 ──────────────────────────────────
echo [✓] 启动前端服务 (端口 3000)...
start "yt-dlp Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

REM ── 等待前端就绪 ──────────────────────────────
echo [ ] 等待前端就绪...
:wait_frontend
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000 >nul 2>nul
if %errorlevel% neq 0 goto wait_frontend
echo [✓] 前端就绪

REM ── 打开浏览器 ────────────────────────────────
echo [✓] 打开浏览器...
start http://localhost:3000

echo.
echo ╔══════════════════════════════════════════╗
echo ║  服务已启动，关闭终端窗口即可停止服务    ║
echo ║  前端: http://localhost:3000             ║
echo ║  API:  http://localhost:8000/docs        ║
echo ╚══════════════════════════════════════════╝
echo.

pause
