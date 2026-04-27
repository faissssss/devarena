@echo off
REM Start DevArena development servers
REM This script starts both backend and frontend servers concurrently

echo Starting DevArena development environment...

REM Start backend in a new window
start "DevArena Backend" cmd /k "cd backend && npm run dev"

REM Wait 2 seconds for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend in a new window
start "DevArena Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Backend running on http://localhost:3000
echo Frontend running on http://localhost:5173
echo.
echo Close the terminal windows to stop the servers
