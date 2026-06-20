@echo off
cd /d "%~dp0"
echo yt-dlp Web starting...
echo.
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
