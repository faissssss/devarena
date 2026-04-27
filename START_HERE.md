# 🚀 Quick Start Guide

## Development Mode (Two Servers)

### Windows Users (Easiest)
Double-click `start-dev.bat` 

This will open two terminal windows:
- Backend server (port 3000)
- Frontend server (port 5173)

**Keep both windows open while developing.**

### Alternative: Manual Start
If the batch script doesn't work, open two separate terminals:

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd frontend  
npm run dev
```

## Production Mode (Single Server) ⭐ RECOMMENDED

### Windows Users
Double-click `start-prod.bat`

This will:
1. Build the frontend
2. Start a single server on port 3000 that serves both API and frontend

### Manual Production Start
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
set NODE_ENV=production
node src/server.js
```

## Accessing the Application

**Development Mode:** http://localhost:5173  
**Production Mode:** http://localhost:3000

## ⚠️ Important

### Development Mode
**ALWAYS keep both servers running together.** If you see "Network Error":
1. Check that both terminal windows are still open
2. Check that backend shows "DevArena API server running on port 3000"
3. Check that frontend shows "Local: http://localhost:5173/"

### Production Mode
Only one server runs - much simpler! Just keep the one terminal window open.

## Stopping the Servers

- Close the terminal window(s)
- Or press `CTRL+C` in the terminal

## First Time Setup

See `ENV_SETUP_GUIDE.md` for environment configuration.
