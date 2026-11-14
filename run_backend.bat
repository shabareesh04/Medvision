@echo off
title MediVision AI - Backend
echo Starting FastAPI Backend Server on http://127.0.0.1:8000 ...
cd /d "%~dp0backend"
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
) else (
    python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
)
pause

