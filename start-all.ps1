Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting Context-Aware Web Application Services" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "1. Starting ML Microservice on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\ml-service'; python -m uvicorn main:app --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 2

Write-Host "2. Starting Express Backend on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "3. Starting Next.js Frontend on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "All 3 services are now running in their own windows!" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "ML API:   http://localhost:8000" -ForegroundColor White
