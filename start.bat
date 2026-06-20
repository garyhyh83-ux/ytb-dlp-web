@echo off
REM yt-dlp Web Launcher
cd /d "%~dp0"

echo ================================================
echo       yt-dlp Web Download Manager v0.1.0
echo ================================================
echo.

REM ---- Check Python ----
set PYTHON=
python --version >nul 2>nul && set PYTHON=python
py --version >nul 2>nul && set PYTHON=py
if "%PYTHON%"=="" (
    echo [ERROR] Python not found. Install Python 3.11+
    echo          https://www.python.org/downloads/
    echo          Check "Add Python to PATH" during install
    pause
    exit /b 1
)
echo [OK] Python found

REM ---- Check Node.js ----
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

REM ---- Install backend deps ----
%PYTHON% -c "import fastapi, yt_dlp, aiosqlite" 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing backend dependencies...
    %PYTHON% -m pip install -r backend\requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install backend deps
        pause
        exit /b 1
    )
)
echo [OK] Backend deps ready

REM ---- Install frontend deps ----
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies (first time, may take a while)...
    cd frontend
    call npm install
    cd ..
)
echo [OK] Frontend deps ready

REM ---- Build frontend ----
echo [INFO] Building frontend...
cd frontend
call npm run build >nul 2>nul
cd ..

REM ---- Start backend ----
echo [INFO] Starting backend on port 8000...
start "yt-dlp Backend" cmd /k "cd /d %~dp0backend && %PYTHON% main.py"

REM ---- Wait for backend ----
echo [INFO] Waiting for backend to start...
:wait_backend
timeout /t 2 /nobreak >nul
curl -s http://localhost:8000/api/stats >nul 2>nul
if %errorlevel% neq 0 goto wait_backend
echo [OK] Backend ready

REM ---- Open browser ----
echo [OK] Opening browser...
start http://localhost:8000

echo.
echo ================================================
echo   Server running at: http://localhost:8000
echo   API docs at:       http://localhost:8000/docs
echo   Close the terminal windows to stop
echo ================================================
echo.

pause
