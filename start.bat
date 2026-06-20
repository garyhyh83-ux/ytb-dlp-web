@echo off
cd /d "%~dp0"

echo ================================================
echo       yt-dlp Web Download Manager v0.1.0
echo ================================================
echo.

REM ---- Check port 8000 ----
netstat -ano | findstr ":8000.*LISTENING" >/dev/null 2>&1
if not errorlevel 1 (
    echo [WARN] Port 8000 is already in use
    echo        Close any running yt-dlp backend first
    echo        Or visit http://localhost:8000 if already started
    pause
    exit /b 0
)

REM ---- Python check ----
python --version >/dev/null 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found
    pause
    exit /b 1
)

REM ---- Install deps if needed ----
python -c "import fastapi, yt_dlp, aiosqlite" >/dev/null 2>&1
if errorlevel 1 (
    echo [INFO] Installing backend dependencies...
    python -m pip install -r backendequirements.txt
)

REM ---- Build frontend if needed ----
if not exist "frontend
ode_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)
echo [INFO] Building frontend...
cd frontend
call npm run build >/dev/null 2>&1
cd ..

REM ---- Start server ----
echo [INFO] Starting server on http://localhost:8000
start http://localhost:8000
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
