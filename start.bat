@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title yt-dlp Web Launcher

echo.
echo ================================================
echo       yt-dlp Web Download Manager v0.1.0
echo ================================================
echo.

REM ---- Check Python ----
set PYTHON=
python --version >nul 2>&1 && set PYTHON=python
py --version >nul 2>&1 && set PYTHON=py
if "%PYTHON%"=="" (
    echo [ERROR] Python not found. Please install Python 3.11+
    echo         https://www.python.org/downloads/
    goto :end
)
for /f "tokens=*" %%i in ('%PYTHON% --version 2^>^&1') do echo [OK] %%i

REM ---- Check Node.js ----
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org/
    goto :end
)
for /f "tokens=*" %%i in ('node --version 2^>^&1') do echo [OK] Node %%i

REM ---- Backend deps ----
%PYTHON% -c "import fastapi, yt_dlp, aiosqlite" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [INFO] Installing backend dependencies...
    %PYTHON% -m pip install -r backend\requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install. Check your network.
        goto :end
    )
)
echo [OK] Backend dependencies ready

REM ---- Frontend deps ----
if not exist "frontend\node_modules" (
    echo.
    echo [INFO] Installing frontend dependencies (downloading packages)...
    cd frontend
    call npm install
    if errorlevel 1 (
        cd ..
        echo [ERROR] npm install failed. Check Node.js and network.
        goto :end
    )
    cd ..
)
echo [OK] Frontend dependencies ready

REM ---- Build ----
echo.
echo [INFO] Building frontend...
cd frontend
call npm run build >nul 2>&1
cd ..

REM ---- Start backend ----
echo [INFO] Starting backend server...
start "yt-dlp Backend" cmd /k "cd /d %~dp0backend && %PYTHON% -m uvicorn main:app --host 0.0.0.0 --port 8000"

REM ---- Wait ----
echo [INFO] Waiting for backend (port 8000)...
:waitloop
ping -n 3 127.0.0.1 >nul 2>&1
curl -s http://localhost:8000/api/stats >nul 2>&1
if errorlevel 1 goto :waitloop
echo [OK] Backend is running

REM ---- Done ----
echo.
echo ================================================
echo   Open your browser to: http://localhost:8000
echo   API docs at:         http://localhost:8000/docs
echo ================================================
start http://localhost:8000

:end
echo.
pause
