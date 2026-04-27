@echo off
REM Start DevArena in production mode (single server)

echo Building frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo Starting production server...
cd ../backend
set NODE_ENV=production
node src/server.js

pause
