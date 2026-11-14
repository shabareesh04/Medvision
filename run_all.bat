@echo off
title MediVision AI Launcher
echo ===================================================
echo   Starting MediVision AI (Backend + Frontend)
echo ===================================================
echo.
echo 1. Launching Backend in a new terminal window...
start "MediVision Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo 2. Launching Frontend in a new terminal window...
start "MediVision Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend API : http://127.0.0.1:8000
echo Frontend UI : http://localhost:5173
echo ===================================================

