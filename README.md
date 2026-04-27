# DevArena Platform

> Your central hub for discovering developer competitions, hackathons, coding contests, and AI/data science challenges from across the web.

## 🎯 What is DevArena?

DevArena is a full-stack web application that provide competitions from 500+ platforms into a single, searchable hub. Instead of checking multiple websites daily, DevArena brings all competitions to you with smart filtering, bookmarking, and real-time updates.

**Perfect for:**
- 🏆 Competitive programmers looking for contests
- 🤖 AI/ML engineers seeking data science challenges
- 🔐 Security researchers hunting CTF competitions
- 💻 Developers wanting to showcase their skills
- 🎓 Students building their portfolios

## ✨ Features

### Core Features
- 🔍 **Unified Search** - Search across 300+ competition platforms in one place
- 🎯 **Smart Filtering** - Filter by category, platform, date, status, and prize amount
- 📅 **Date Range Picker** - Find competitions within specific timeframes
- 🔖 **Bookmarking System** - Save and organize your favorite competitions
- 🌓 **Dark Mode** - Beautiful light and dark themes with system detection
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Real-time Updates** - Automated sync every 6 hours with latest competitions

### Authentication & Security
- 🔐 **JWT Authentication** - Secure token-based authentication
- 🌐 **OAuth 2.0** - Login with Google or GitHub
- 🔄 **Cross-tab Sync** - Auth state syncs across browser tabs
- ⏰ **Token Monitoring** - Automatic expiration handling with warnings
- 🛡️ **CSRF Protection** - Protected against cross-site request forgery
- 🔒 **Password Security** - Bcrypt hashing with salt rounds

### Data Aggregation
- 🔄 **Auto-sync** - Scheduled data synchronization every 6 hours
- 🌍 **Multiple Sources** - CLIST.by (300+ platforms), Kaggle, and more
- 📊 **Smart Parsing** - Intelligent data normalization and deduplication
- 🏷️ **Category Inference** - AI-powered competition categorization
- 📈 **Data Quality** - Automatic date validation and prize formatting

### User Experience
- 🎨 **Netflix-style Browsing** - Horizontal scrolling competition cards
- 🚀 **Fast Search** - Instant search with debouncing
- 💡 **Recommendation Chips** - Quick filters for Featured, Newest, Popular
- 🎭 **Status Indicators** - Clear badges for ongoing, upcoming, past competitions
- 📍 **Platform Logos** - Visual platform identification
- 🏅 **Prize Display** - Formatted prize amounts with currency

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0 ([Download](https://nodejs.org/))
- PostgreSQL >= 14 ([Download](https://www.postgresql.org/download/))
- npm >= 9.0.0 (comes with Node.js)

### Installation (5 minutes)

```bash
# 1. Clone the repository
git clone <repository-url>
cd devarena-platform

# 2. Install all dependencies
npm run install:all

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see Environment Setup below)

# 4. Create database
createdb devarena

# 5. Run migrations
cd backend
npm run migrate
cd ..

# 6. Start development servers
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/api/health

### Quick Start Scripts

**Windows:**
- `start-dev.bat` - Opens two terminals (backend + frontend)
- `start-prod.bat` - Builds and starts production server

**Linux/Mac:**
- `start-dev.sh` - Starts both servers in background
- `start-prod.sh` - Builds and starts production server

## ⚙️ Environment Setup

### Required Environment Variables

Create a `.env` file in the project root with these variables:

```env
# Database (choose one option below)
DATABASE_URL=postgresql://postgres:password@localhost:5432/devarena

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your-32-character-secret-here

# Server
PORT=3000
CORS_ORIGIN=http://localhost:5173

# CLIST API (get free key from clist.by)
CLIST_API_URL=https://clist.by/api/v4/contest/
CLIST_API_KEY=your-clist-api-key

# Optional: Kaggle API
KAGGLE_API_KEY=your-kaggle-api-key
KAGGLE_USERNAME=your-kaggle-username

# Data Sync
SYNC_SCHEDULE=0 */6 * * *
SYNC_TIMEOUT=30000
SYNC_RETRIES=3

# Environment
NODE_ENV=development
```

### Database Options

**Option 1: Supabase (Recommended for Quick Start)**
1. Go to [supabase.com](https://supabase.com) and create a project
2. Get connection string from Settings → Database
3. Use: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

**Option 2: Local PostgreSQL**
1. Install PostgreSQL 14+
2. Create database: `createdb devarena`
3. Use: `postgresql://postgres:postgres@localhost:5432/devarena`

**Option 3: Neon.tech (Serverless)**
1. Go to [neon.tech](https://neon.tech) and create a project
2. Copy connection string from dashboard

**Option 4: Railway.app**
1. Go to [railway.app](https://railway.app) and add PostgreSQL
2. Copy connection URL from Connect tab

### API Keys Setup

**CLIST.by (Required):**
1. Go to [clist.by](https://clist.by/)
2. Sign up for free account
3. Go to Settings → API → Generate API Key
4. Add to `.env`: `CLIST_API_KEY=your-key`

**Kaggle (Optional):**
1. Go to [kaggle.com](https://www.kaggle.com/)
2. Account → API → Create New API Token
3. Download `kaggle.json` and copy credentials
4. Add to `.env`

### Generate JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Hooks
- **Build Tool**: Vite 
- **Styling**: TailwindCSS with custom design system
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **State Management**: Context API
- **Testing**: Vitest + React Testing Library

### Backend
- **Framework**: Express.js
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT + bcrypt + OAuth 2.0
- **Scheduler**: node-cron for automated sync
- **Validation**: express-validator
- **Testing**: Jest + Supertest + fast-check (PBT)

### DevOps
- **Containerization**: Docker + Docker Compose
- **E2E Testing**: Playwright
- **Code Quality**: ESLint

## 📁 Project Structure

```
devarena-platform/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React Context providers
│   │   ├── services/        # API client services
│   │   ├── utils/           # Utility functions
│   │   └── assets/          # Images, logos, icons
│   └── package.json
│
├── backend/                  # Express.js backend API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── parsers/         # API response parsers
│   │   └── utils/           # Utility functions
│   ├── migrations/          # Database migrations
│   ├── scripts/             # Utility scripts
│   └── package.json
│
├── e2e/                      # End-to-end tests
├── docs/                     # Technical documentation
├── .kiro/                    # Kiro AI specs
├── docker-compose.yml        # Development Docker setup
└── package.json              # Root package (monorepo)
```

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only (port 5173)
npm run dev:backend      # Start backend only (port 3000)

# Building
npm run build            # Build frontend for production

# Production
npm run start:prod       # Start production server

# Installation
npm run install:all      # Install all dependencies
```

### Development Tips

**Hot Reload:**
- Frontend: Changes reflect instantly in browser
- Backend: Server restarts automatically on file changes

**Debugging:**
- Frontend: Use React DevTools browser extension
- Backend: Check terminal logs for errors
- Database: Use `psql` or pgAdmin to inspect data

**Common Commands:**
```bash
# Run tests
npm test

# Lint code
cd backend && npm run lint
cd frontend && npm run lint

# Database migrations
cd backend
npm run migrate
```

## 🚢 Production Deployment

DevArena is production-ready with enterprise-grade security features!

### ⚡ Quick Deploy to Vercel (Recommended)

**Deploy in 10 minutes:**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Configure environment variables in Vercel Dashboard
# 4. Redeploy
vercel --prod
```

**See [VERCEL_QUICKSTART.md](VERCEL_QUICKSTART.md) for complete guide.**

### Other Deployment Options

**Option 1: Docker (Recommended for Self-Hosting)**

```bash
# Build and deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec app node backend/migrations/run-migrations.js
```

**Option 2: Manual Deployment**

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Set environment
export NODE_ENV=production

# 3. Start backend (serves both API and static frontend)
cd ../backend
node src/server.js
```

**Access:** http://localhost:3000

### Production Features

- 🛡️ **Helmet.js** - Security headers enabled
- 🚦 **Rate Limiting** - API abuse prevention
- 📝 **Winston Logging** - Production-grade logging with rotation
- 🐳 **Docker Ready** - Multi-stage optimized Dockerfile
- 🔒 **HTTPS Ready** - SSL/TLS configuration included
- 📊 **Health Checks** - Container and application monitoring

### Deployment Guides

- **Vercel**: [VERCEL_QUICKSTART.md](VERCEL_QUICKSTART.md) - 10-minute deployment
- **Complete Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - All deployment options
- **Vercel Detailed**: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Comprehensive Vercel guide

### Platform Options

1. **Vercel** - Easiest, automatic HTTPS, global CDN (recommended)
2. **Railway** - Simple, auto-deploy from GitHub
3. **Render** - Easy setup, free tier available
4. **Docker** - Self-hosted, full control
5. **VPS** - Ubuntu + Nginx + PM2, traditional hosting

## 🧪 Testing

### Unit & Integration Tests

```bash
# Run all tests
npm test

# Backend tests
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage

# Frontend tests
cd frontend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

### End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium
```

## ⚠️ Troubleshooting

### "Network Error" in Frontend
**Problem:** Frontend can't connect to backend.

**Solution:**
1. Check backend terminal shows: "DevArena API server running on port 3000"
2. Check frontend terminal shows: "Local: http://localhost:5173/"
3. Verify CORS_ORIGIN in `.env` matches frontend URL

### "Database Connection Error"
**Problem:** Can't connect to PostgreSQL.

**Solution:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env` is correct
3. Ensure database exists: `psql -l | grep devarena`
4. For cloud databases, check if your IP is whitelisted

### "API Key Error"
**Problem:** CLIST API returns 401 Unauthorized.

**Solution:**
1. Get API key from [clist.by](https://clist.by/)
2. Add to `.env`: `CLIST_API_KEY=your-key-here`
3. Restart backend server

### "JWT_SECRET must be at least 32 characters"
**Problem:** JWT secret is too short.

**Solution:** Generate a new secret:
```bash
openssl rand -hex 32
```

## 📚 Documentation

### Production Deployment
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete production deployment guide
- [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification
- [PRODUCTION_READY_SUMMARY.md](PRODUCTION_READY_SUMMARY.md) - Security features summary

### Technical Documentation
- [docs/API.md](docs/API.md) - API endpoints and usage
- [docs/DESIGN.md](docs/DESIGN.md) - Architecture and design decisions
- [docs/AUTHENTICATION_FIXES.md](docs/AUTHENTICATION_FIXES.md) - Auth system details
- [docs/DATE_FIX_SUMMARY.md](docs/DATE_FIX_SUMMARY.md) - Date handling implementation

### Testing & Troubleshooting
- [docs/QUICK_TEST_GUIDE.md](docs/QUICK_TEST_GUIDE.md) - Quick testing guide
- [docs/MANUAL_TEST_CHECKLIST.md](docs/MANUAL_TEST_CHECKLIST.md) - Manual test checklist
- [docs/KONTESTS_API_WORKAROUND.md](docs/KONTESTS_API_WORKAROUND.md) - API troubleshooting

### Database
- [backend/migrations/README.md](backend/migrations/README.md) - Migration guide
- [backend/migrations/SCHEMA_DIAGRAM.md](backend/migrations/SCHEMA_DIAGRAM.md) - Database schema

## 🔐 Security Features

- ✅ **Helmet.js Security Headers** - XSS, clickjacking, MIME sniffing protection
- ✅ **Three-Tier Rate Limiting** - API abuse prevention (100/15min, auth 5/15min, sync 10/hr)
- ✅ **Winston Production Logging** - Structured logging with file rotation
- ✅ JWT-based authentication with secure token storage
- ✅ OAuth 2.0 integration (Google, GitHub)
- ✅ CSRF protection on all state-changing endpoints
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ SQL injection prevention with parameterized queries
- ✅ XSS protection with input sanitization
- ✅ CORS configuration for API security
- ✅ Token expiration monitoring with automatic logout
- ✅ Cross-tab authentication synchronization

## ⚡ Performance Optimizations

- ⚡ Vite for lightning-fast HMR (Hot Module Replacement)
- ⚡ PostgreSQL connection pooling
- ⚡ Efficient database indexing on frequently queried columns
- ⚡ API response caching
- ⚡ Lazy loading for routes
- ⚡ Optimized bundle splitting
- ⚡ Debounced search input
- ⚡ Virtualized lists for large datasets

## 🎨 Key Features Explained

### Smart Competition Discovery
- **300+ Platforms**: Aggregates from CLIST.by, Kaggle, and more
- **Auto-categorization**: AI-powered category inference engine
- **Real-time Updates**: Scheduled sync every 6 hours
- **Data Quality**: Automatic validation and normalization

### Advanced Filtering
- **Multi-select Platforms**: Filter by specific platforms (CodeForces, LeetCode, etc.)
- **Date Range Picker**: Custom date range selection with calendar UI
- **Status Filters**: Ongoing, upcoming, or past competitions
- **Category Filters**: 10+ competition categories (CP, AI/ML, CTF, etc.)
- **Prize Filters**: Find competitions by prize amount
- **Search**: Instant search across titles and descriptions

### User Experience
- **Horizontal Scrolling**: Netflix-style competition browsing
- **Bookmark System**: Save and organize favorites
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: System-aware theme switching
- **Fast Search**: Instant search with debouncing
- **Recommendation Chips**: Quick access to Featured, Newest, Popular

## 💡 Pro Tips

1. **Use Dark Mode**: Toggle theme in the top navigation
2. **Keyboard Shortcuts**: Press `/` to focus search
3. **Bookmark Competitions**: Click the bookmark icon to save favorites
4. **Filter Efficiently**: Use recommendation chips for quick filters
5. **Date Range**: Use the date picker for custom date ranges
6. **Platform Logos**: Quickly identify competitions by platform logo
7. **Status Badges**: Check badges for ongoing/upcoming status

## 🗺️ Roadmap

- [ ] Add more competition platforms (HackerRank, TopCoder, etc.)
- [ ] Implement AI-powered competition recommendations
- [ ] Add email notifications for bookmarked competitions
- [ ] Create mobile app (React Native)
- [ ] Add competition calendar view
- [ ] Implement user profiles and achievements
- [ ] Add social features (share, comment, discuss)
- [ ] Create browser extension for quick access
- [ ] Add competition difficulty ratings
- [ ] Implement team formation features

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **CLIST.by** - Primary competition data source (300+ platforms)
- **Kaggle** - ML/AI competition data
- **React** - Frontend framework
- **Express.js** - Backend framework
- **PostgreSQL** - Database
- **TailwindCSS** - Styling framework
- **Vite** - Build tool

## 📞 Support & Contact

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/devarena/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/devarena/discussions)
- 📧 **Email**: support@devarena.com

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

**Before contributing:**
- Run linters: `npm run lint` in both frontend and backend
- Write tests for new features
- Update documentation as needed
- Follow existing code style

---

**Built with ❤️ for the developer community**

*Last updated: April 27, 2026*
