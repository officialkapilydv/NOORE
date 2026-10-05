@echo off
title NOORE - Docker (development, hot reload)
cd /d "%~dp0"
echo.
echo   Starting the NOORE development container...
echo.
docker compose -f docker-compose.dev.yml up -d
if errorlevel 1 (
  echo.
  echo   Docker returned an error. Is Docker Desktop running?
  pause
  exit /b 1
)
echo.
echo   Waiting for the dev server (the first start installs dependencies, about a minute)...
set /a NOORE_TRIES=0
:wait
rem ready = the dev server answers AND the API behind it is up (-f fails on HTTP errors such as the proxy 500)
curl -s -f -o nul http://localhost:5173/api/health && goto ready
set /a NOORE_TRIES+=1
if %NOORE_TRIES% geq 120 goto ready
ping -n 3 127.0.0.1 >nul
goto wait
:ready
echo.
echo   Storefront : http://localhost:5173      Admin : http://localhost:5173/admin
echo   The API runs inside the container; the dev server forwards /api to it.
echo   Edit files in this folder and the site reloads. Logs: Docker Desktop ^> Containers ^> noore-dev.
echo.
start "" http://localhost:5173
pause
