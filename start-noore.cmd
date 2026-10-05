@echo off
title NOORE - Docker
cd /d "%~dp0"
echo.
echo   Building and starting NOORE in Docker Desktop (first build takes a few minutes)...
echo.
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo   Docker returned an error. Is Docker Desktop running?
  echo.
  pause
  exit /b 1
)
echo.
echo   NOORE is up.
echo     Storefront : http://localhost:4000
echo     Admin      : http://localhost:4000/admin   (admin@noore.in / noore-admin-2026 unless changed in .env)
echo.
echo   Manage it from Docker Desktop ^> Containers ^> "noore". Opening the storefront...
timeout /t 5 >nul
start "" http://localhost:4000
pause
