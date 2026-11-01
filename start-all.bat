@echo off
echo ========================================================
echo Starting Context-Aware Web Application Services
echo ========================================================

echo 1. Starting ML Microservice on port 8000...
start "ML Microservice (Port 8000)" cmd /k "cd /d %~dp0ml-service && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo 2. Starting Express Backend on port 5000...
start "Backend API (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 3 /nobreak >nul

echo 3. Starting Next.js Frontend on port 3000...
start "Frontend UI (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo Opening Web Browser at http://localhost:3000 ...
start http://localhost:3000

echo ========================================================
echo All 3 services have been launched in separate windows!
echo Keep those windows open while testing the application.
echo ========================================================
pause
