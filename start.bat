@echo off
chcp 65001 >nul 2>nul
title yt-dlp Web 启动器
cd /d "%~dp0"

echo.
echo ╔══════════════════════════════════════════╗
echo ║     yt-dlp Web 视频下载系统 v0.1.0       ║
echo ╚══════════════════════════════════════════╝
echo.

REM ── 检查 Python ──────────────────────────────
set PYTHON=
python --version >nul 2>nul && set PYTHON=python
py --version >nul 2>nul && set PYTHON=py
if "%PYTHON%"=="" (
    echo [✕] 未找到 Python，请安装 Python 3.11+
    echo     下载地址: https://www.python.org/downloads/
    echo     安装时务必勾选 "Add Python to PATH"
    pause
    exit /b 1
)
echo [✓] Python: %PYTHON%

REM ── 检查 Node.js ─────────────────────────────
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo [✕] 未找到 Node.js，请安装 Node.js
    echo     下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [✓] Node.js: %%i

REM ── 安装后端依赖 ────────────────────────────
echo.
python -c "import fastapi, yt_dlp, aiosqlite" 2>nul
if %errorlevel% neq 0 (
    echo [!] 正在安装后端依赖...
    %PYTHON% -m pip install -r backend\requirements.txt
    if %errorlevel% neq 0 (
        echo [✕] 后端依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
)
echo [✓] 后端依赖就绪

REM ── 安装前端依赖 ────────────────────────────
if not exist "frontend\node_modules" (
    echo [!] 正在安装前端依赖（首次需要几分钟）...
    cd frontend
    call npm install
    cd ..
    if %errorlevel% neq 0 (
        echo [✕] 前端依赖安装失败
        pause
        exit /b 1
    )
)
echo [✓] 前端依赖就绪

REM ── 构建前端（生产模式）─────────────────────
echo.
echo [ ] 构建前端...
cd frontend
call npm run build >nul 2>nul
cd ..
if %errorlevel% neq 0 (
    echo [!] 前端构建失败，将使用开发模式
)

REM ── 启动后端 ──────────────────────────────────
echo [✓] 启动后端服务 (端口 8000)...
start "yt-dlp Backend" cmd /k "cd /d %~dp0backend && %PYTHON% main.py"

REM ── 等待后端就绪 ──────────────────────────────
echo [ ] 等待后端就绪...（如卡住请检查 8000 端口是否被占用）
:wait_backend
timeout /t 2 /nobreak >nul
curl -s http://localhost:8000/api/stats >nul 2>nul
if %errorlevel% neq 0 goto wait_backend
echo [✓] 后端就绪

REM ── 打开浏览器 ────────────────────────────────
echo [✓] 打开浏览器...
start http://localhost:8000

echo.
echo ╔══════════════════════════════════════════╗
echo ║  启动完成！                              ║
echo ║  地址: http://localhost:8000             ║
echo ║  API:  http://localhost:8000/docs        ║
echo ║  关闭两个终端窗口即可停止服务            ║
echo ╚══════════════════════════════════════════╝
echo.

pause
