# DevArena Platform

<div align="center">
  <img src="frontend/src/assets/banner/dev-arena-banner.png" alt="DevArena Banner" width="100%">
  
  <p align="center">
    <strong>Your central hub for discovering developer competitions, hackathons, coding contests, and AI/data science challenges from across the web.</strong>
  </p>
  
  <p align="center">
    <a href="https://devarena.vercel.app" target="_blank">🚀 Live Demo</a> •
    <a href="#-features">Features</a> •
    <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
    <a href="#-architecture">Architecture</a>
  </p>
</div>

---

## 🎯 What is DevArena?

DevArena aggregates competitions from 500+ platforms into a single, searchable hub. Instead of checking multiple websites daily, DevArena brings all competitions to you with smart filtering, bookmarking, and real-time updates.

**Perfect for:** Competitive programmers, AI/ML engineers, security researchers, and developers looking to showcase their skills.

## ✨ Features

- 🔍 **Unified Search** - Search across 500+ competition platforms
- 🎯 **Smart Filtering** - Filter by category, platform, date, status, and prize
- 📅 **Date Range Picker** - Find competitions within specific timeframes
- 🔖 **Bookmarking System** - Save and organize favorites
- 🔐 **JWT + OAuth 2.0** - Secure authentication with Google/GitHub login
- 🌓 **Dark Mode** - Beautiful themes with system detection
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Real-time Updates** - Automated sync every 6 hours
- 🎨 **Netflix-style UI** - Horizontal scrolling competition cards
- 🛡️ **Enterprise Security** - Helmet.js, rate limiting, CSRF protection

## �️ Tech Stack

**Frontend**
- React 18 + Vite
- TailwindCSS
- React Router v6
- Axios + Context API

**Backend**
- Express.js + PostgreSQL
- JWT + bcrypt + OAuth 2.0
- node-cron (automated sync)
- Helmet.js (security headers)
- Winston (production logging)

**Testing**
- Vitest + React Testing Library
- Jest + Supertest
- fast-check (Property-Based Testing)
- Playwright (E2E)

## 📁 Architecture

```
devarena-platform/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # Auth & theme context
│   │   ├── services/        # API client
│   │   └── assets/          # Images & logos
│   └── package.json
│
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, CSRF, security
│   │   ├── parsers/         # API response parsers
│   │   └── utils/           # DB, logger, helpers
│   ├── migrations/          # Database migrations
│   └── package.json
│
└── package.json              # Root (monorepo)
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### Installation

```bash
# 1. Clone and install
git clone <repository-url>
cd devarena-platform
npm run install:all

# 2. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3. Setup database
createdb devarena
cd backend && npm run migrate && cd ..

# 4. Start development
npm run dev
```

**Access:** Frontend at http://localhost:5173, API at http://localhost:3000

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configure environment variables in Vercel Dashboard
# Then deploy to production
vercel --prod
```

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string (use Supabase/Neon/Railway)
  - **IMPORTANT**: For Vercel/serverless, use Supabase pooler URL: `postgresql://...@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
  - Direct URL format causes connection exhaustion in serverless environments
- `JWT_SECRET` - Generate with: `openssl rand -hex 32`
- `CLIST_API_KEY` - Get from [clist.by](https://clist.by/)
- `CORS_ORIGIN` - Your Vercel domain (e.g., `https://your-app.vercel.app`)
- `APP_URL` - Your Vercel domain (e.g., `https://your-app.vercel.app`)
- `API_URL` - Your Vercel domain (e.g., `https://your-app.vercel.app`)
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `GITHUB_CLIENT_ID` - From GitHub Developer Settings
- `GITHUB_CLIENT_SECRET` - From GitHub Developer Settings
- `NODE_ENV=production`

**OAuth Configuration:**
- Google Console: Set redirect URI to `https://your-app.vercel.app/api/auth/oauth/google/callback`
- GitHub Settings: Set callback URL to `https://your-app.vercel.app/api/auth/oauth/github/callback`

**Database Options for Production:**
- [Supabase](https://supabase.com) - Recommended, free tier available (use pooler URL for serverless)
- [Neon.tech](https://neon.tech) - Serverless PostgreSQL
- [Railway](https://railway.app) - Simple setup

**Detailed Deployment Guide:**
See [.kiro/specs/vercel-stabilization/DEPLOYMENT_GUIDE.md](.kiro/specs/vercel-stabilization/DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions, configuration requirements, and troubleshooting.

### Other Deployment Options

**Docker:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Manual:**
```bash
cd frontend && npm run build
cd ../backend && NODE_ENV=production node src/server.js
```

## 📝 License

MIT License

## 🙏 Acknowledgments

- **CLIST.by** - Competition data (300+ platforms)
- **Kaggle** - ML/AI competition data
- **React, Express.js, PostgreSQL, TailwindCSS, Vite**

---

**Built with ❤️ for the developer community**
