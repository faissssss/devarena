# DevArena Platform

A full-stack web application that aggregates developer competitions, hackathons, coding contests, and AI/data science challenges from multiple sources into a single searchable hub.

## Project Structure

```
devarena-platform/
├── frontend/          # React + Vite + TailwindCSS
├── backend/           # Express.js REST API
├── .env.example       # Environment variables template
├── package.json       # Root package.json (monorepo)
└── README.md
```

## Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library

### Backend
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Scheduler**: node-cron
- **Testing**: Jest + Supertest + fast-check (property-based testing)

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd devarena-platform
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create PostgreSQL database
createdb devarena

# Run migrations (to be implemented)
npm run migrate --workspace=backend
```

### Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Frontend (http://localhost:5173)
npm run dev --workspace=frontend

# Backend (http://localhost:3000)
npm run dev --workspace=backend
```

### Building for Production

```bash
npm run build
```

### Code Quality

```bash
# Lint all code
npm run lint

# Format all code
npm run format

# Check formatting
npm run format:check
```

## Environment Variables

See `.env.example` for all required environment variables:

- **DATABASE_URL**: PostgreSQL connection string
- **DB_POOL_SIZE**: Maximum PostgreSQL pool size in production/runtime
- **JWT_SECRET**: Secret key for JWT token signing (minimum 32 characters)
- **JWT_EXPIRES_IN**: JWT expiration window (default: 7d)
- **PORT**: Backend server port (default: 3000)
- **CORS_ORIGIN**: Frontend URL for CORS (default: http://localhost:5173)
- **KONTESTS_API_URL**: Kontests.net API endpoint
- **CLIST_API_URL**: CLIST.by API endpoint
- **CLIST_API_KEY**: CLIST.by API key
- **KAGGLE_API_KEY**: Kaggle API key
- **KAGGLE_USERNAME**: Kaggle username
- **SYNC_SCHEDULE**: Cron expression for data sync (default: every 6 hours)
- **SYNC_TIMEOUT**: API request timeout in milliseconds
- **SYNC_RETRIES**: Number of retry attempts for failed API requests

## Features

- ✅ Automated data synchronization from multiple competition APIs
- ✅ User authentication and authorization (JWT-based)
- ✅ Competition search and filtering
- ✅ Personalized bookmarking system
- ✅ Admin panel for manual sync and competition management
- ✅ Responsive design with TailwindCSS

## API Documentation

API endpoints will be documented using OpenAPI/Swagger (to be implemented).

Base URL: `http://localhost:3000/api`

### Health Check
```
GET /api/health
```

## Testing

```bash
# Run all tests
npm test

# Run frontend tests
npm test --workspace=frontend

# Run backend tests
npm test --workspace=backend

# Run tests in watch mode
npm run test:watch --workspace=backend
```

```bash
# Run end-to-end tests
npm run test:e2e
```

## Deployment

Production configuration template: `.env.production.example`

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.prod.yml up --build -d
```

The backend production startup path runs:

1. Database migrations
2. Schema verification
3. Server boot

See:

- `backend/scripts/startup.js`
- `backend/scripts/seed-admin.js`
- `docker-compose.prod.yml`

## Manual Verification

See [MANUAL_TEST_CHECKLIST.md](/c:/antigravity/dev-arena/MANUAL_TEST_CHECKLIST.md).

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## License

MIT
