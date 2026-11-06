@echo off
title IPTV Player - Frontend & Backend
color 0A

echo ==========================================
echo IPTV Player Application Launcher
echo ==========================================
echo.

:: Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js first.
    pause
    exit /b 1
)

:: Set environment variables
set VITE_API_URL=http://localhost:3001
set NODE_OPTIONS=--openssl-legacy-provider

:: Create .env file for Vite if not exists
if not exist .env echo VITE_API_URL=http://localhost:3001 > .env

:: Frontend directory
set FRONTEND_DIR=D:\Programming Practice\IPTV-Player

:: Backend directory
set BACKEND_DIR=D:\Programming Practice\IPTV-Player\server

echo.
echo Starting Backend (Express + MongoDB) on http://localhost:3001
echo Starting Frontend (Vite) on http://localhost:5173
echo.

:: Start Backend in background
start "Backend" cmd /k "cd /d %BACKEND_DIR% && set VITE_API_URL=http://localhost:3001 && npm run dev"

:: Wait a moment for backend to start
timeout /t 3 >nul

:: Start Frontend in background
start "Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo Both servers are starting...
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo.
echo Press Ctrl+C to stop either server, or close this window.
echo.

:: Wait for both processes
timeout /t 5 >nul