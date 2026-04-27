# DevArena Development Setup

## Quick Start

### Option 1: Single Command (Recommended)
Run both servers with one command:

```bash
npm run dev
```

This starts both backend (port 3000) and frontend (port 5173) concurrently.

### Option 2: Windows Batch Script
Double-click `start-dev.bat` or run:

```bash
start-dev.bat
```

This opens two terminal windows - one for backend, one for frontend.

### Option 3: Manual Start
Open two terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Important Notes

- **Always run both servers together** - the frontend needs the backend API
- Backend runs on `http://localhost:3000`
- Frontend runs on `http://localhost:5173`
- If you see "Network Error", check that both servers are running

## Stopping Servers

- **Option 1 (npm run dev)**: Press `CTRL+C` in the terminal
- **Option 2 (batch script)**: Close both terminal windows
- **Option 3 (manual)**: Press `CTRL+C` in each terminal

## First Time Setup

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables (see ENV_SETUP_GUIDE.md)

3. Run database migrations:
```bash
cd backend
node migrations/run-migrations.js
```

4. Start development servers:
```bash
npm run dev
```
