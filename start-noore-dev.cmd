@echo off
title NOORE - Docker (development, hot reload)
cd /d "%~dp0"
echo.
echo   Starting the NOORE development container (first start installs dependencies, 2-3 minutes)...
echo.
docker compose -f docker-compose.dev.yml up -d
if errorlevel 1 (
  echo.
  echo   Docker returned an error. Is Docker Desktop running?
  pause
  exit /b 1
)
echo.
echo   Storefront : http://localhost:5173      Admin : http://localhost:5173/admin
echo   API        : http://localhost:4000
echo   Edit files in this folder and the site reloads. Logs: Docker Desktop ^> Containers ^> noore-dev.
echo.
timeout /t 5 >nul
start "" http://localhost:5173
pause
