@echo off
cd /d "%~dp0"
echo yt-dlp Web starting...
echo.

REM ---- Free port 8000 ----
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING"') do (
    echo Killing process on port 8000: %%a
    taskkill /f /pid %%a >/dev/null 2>&1
)

REM ---- Start server ----
cd backend
echo Starting backend on port 8000...
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
