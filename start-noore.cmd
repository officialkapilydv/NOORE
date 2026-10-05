@echo off
title NOORE - Docker
cd /d "%~dp0"

rem Port the site is published on - same precedence as Docker Compose:
rem a NOORE_PORT environment variable, then NOORE_PORT in .env, then 4000.
if not defined NOORE_PORT if exist ".env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if /i "%%A"=="NOORE_PORT" for /f "tokens=1" %%P in ("%%B") do set "NOORE_PORT=%%~P"
  )
)
if not defined NOORE_PORT set "NOORE_PORT=4000"

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
echo     Storefront : http://localhost:%NOORE_PORT%
echo     Admin      : http://localhost:%NOORE_PORT%/admin   (admin@noore.in / noore-admin-2026 unless changed in .env)
echo.
echo   Manage it from Docker Desktop ^> Containers ^> "noore". Opening the storefront...
timeout /t 5 >nul
start "" http://localhost:%NOORE_PORT%
pause
