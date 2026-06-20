@echo off
cd /d "%~dp0"
echo yt-dlp Web starting...
echo.

REM ---- Check if port 8000 is already in use ----
netstat -ano | findstr ":8000" | findstr "LISTENING" >/dev/null 2>&1
if not errorlevel 1 (
    echo Port 8000 is already in use.
    echo Another instance may be running.
    echo.
    echo Try visiting http://localhost:8000 in your browser.
    echo If that does not work, restart your computer.
    pause
    exit /b
)

REM ---- Start server ----
echo Starting backend on port 8000...
cd /d "%~dp0backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
