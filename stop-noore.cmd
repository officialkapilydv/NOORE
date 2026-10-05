@echo off
title NOORE - Docker
cd /d "%~dp0"
echo.
echo   Stopping NOORE...
docker compose stop
echo.
echo   Stopped. Your orders, products, settings and uploads are kept.
echo   Start it again with the play button in Docker Desktop ^> Containers ^> noore,
echo   or double-click start-noore.cmd (use that one after changing the code).
echo.
pause
