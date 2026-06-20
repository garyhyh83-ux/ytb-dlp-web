@echo off
echo Hello from yt-dlp Web
echo.
echo Starting backend...
cd /d %~dp0backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
