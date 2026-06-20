@echo off
cd /d "%~dp0"
echo yt-dlp Web starting...
echo.

REM ---- Kill existing process on port 8000 ----
echo Checking port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r ":8000.*LISTENING"') do (
    echo Killing PID %%a...
    taskkill //F //PID %%a >/dev/null 2>&1
    ping -n 2 127.0.0.1 >/dev/null 2>&1
)

REM ---- Start server ----
echo.
echo Starting backend...
cd /d "%~dp0backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
