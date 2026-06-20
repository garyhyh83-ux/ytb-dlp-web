@echo off
cd /d "%~dp0"
echo Starting yt-dlp Web on port 8000...
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
