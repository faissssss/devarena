# DevArena Environment Setup Guide

This guide will help you set up all required environment variables for the DevArena platform. We'll cover both local PostgreSQL and cloud database options (Supabase, Neon, Railway).

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Follow the sections below to fill in each variable

---

## 📦 Database Configuration

You have several options for PostgreSQL:

### Option 1: Supabase (Recommended for Quick Start) ✨

**Pros:** Free tier, managed, includes auth & storage, great dashboard
**Cons:** Shared resources on free tier

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to provision (~2 minutes)
4. Go to **Settings** → **Database**
5. Find **Connection String** → **URI** (not the pooler)
6. Copy the connection string

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Important:** Replace `[YOUR-PASSWORD]` with your actual database password (shown when you created the project)

### Option 2: Neon (Great for Serverless)

**Pros:** Serverless, auto-scaling, generous free tier, fast cold starts
**Cons:** Connection pooling required for high traffic

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard

```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### Option 3: Railway (Simple Deployment)

**Pros:** Easy deployment, includes PostgreSQL, CI/CD built-in
**Cons:** Free tier limited

1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Click on PostgreSQL service → **Connect** tab
4. Copy the **Postgres Connection URL**

```env
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/railway
```

### Option 4: Local PostgreSQL

**Pros:** Full control, no internet required, free
**Cons:** Manual setup, maintenance required

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. Create database:
   ```bash
   createdb devarena
   ```

3. Use this connection string:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devarena
   ```

**Note:** Replace `postgres:postgres` with your actual username:password

---

## 🔐 JWT Configuration

Generate a secure secret key for JWT token signing:

### Quick Generation (Recommended)

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and paste it:

```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Requirements:**
- ✅ Minimum 32 characters
- ✅ Random and unpredictable
- ❌ Don't use simple phrases or dictionary words

---

## 🌐 Server Configuration

### PORT
The port your backend server will run on:

```env
PORT=3000
```

**Common ports:** 3000, 8000, 8080, 5000

### CORS_ORIGIN
The URL of your frontend application:

```env
# Development
CORS_ORIGIN=http://localhost:5173

# Production (update when deploying)
CORS_ORIGIN=https://your-domain.com
```

---

## 🔌 External API Configuration

### 1. Kontests.net API (No API Key Required) ✅

This API is **free and doesn't require authentication**:

```env
KONTESTS_API_URL=https://kontests.net/api/v1/all
```

**Test it:**
```bash
curl https://kontests.net/api/v1/all
```

### 2. CLIST.by API (API Key Required)

**Get your API key:**

1. Go to [clist.by](https://clist.by/)
2. Create an account (free)
3. Go to **Settings** → **API**
4. Generate an API key

```env
CLIST_API_URL=https://clist.by/api/v2/contest/
CLIST_API_KEY=your-actual-api-key-here
```

**Note:** CLIST has rate limits on free tier (check their docs)

### 3. Kaggle API (API Key Required)

**Get your API credentials:**

1. Go to [kaggle.com](https://www.kaggle.com/)
2. Create an account (free)
3. Go to **Account** → **API** → **Create New API Token**
4. Download `kaggle.json` file
5. Open the file and copy the credentials

```env
KAGGLE_API_TOKEN=your_api_token
KAGGLE_USERNAME=your_kaggle_username
```

**Alternative:** If you don't want Kaggle competitions initially, you can use a placeholder:
```env
KAGGLE_API_KEY=placeholder-key-for-development
KAGGLE_USERNAME=placeholder-username
```

---

## ⏰ Data Sync Configuration

These control how often the platform fetches new competitions:

```env
# Cron schedule (every 6 hours by default)
SYNC_SCHEDULE=0 */6 * * *

# API request timeout (30 seconds)
SYNC_TIMEOUT=30000

# Number of retry attempts for failed requests
SYNC_RETRIES=3
```

**Cron Schedule Examples:**
- `0 */6 * * *` - Every 6 hours
- `0 */1 * * *` - Every hour
- `*/30 * * * *` - Every 30 minutes
- `0 0 * * *` - Once daily at midnight

---

## 🔧 Node Environment

```env
NODE_ENV=development
```

**Options:**
- `development` - Local development with detailed logs
- `production` - Production deployment with optimizations
- `test` - Running tests

---

## ✅ Complete Example

Here's a complete `.env` file with Supabase:

```env
# Database Configuration (Supabase)
DATABASE_URL=postgresql://postgres:your-password@db.abcdefghijklmnop.supabase.co:5432/postgres

# JWT Configuration (generated with openssl rand -hex 32)
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# Server Configuration
PORT=3000
CORS_ORIGIN=http://localhost:5173

# External API Configuration - Kontests.net (no key needed)
KONTESTS_API_URL=https://kontests.net/api/v1/all

# External API Configuration - CLIST.by
CLIST_API_URL=https://clist.by/api/v2/contest/
CLIST_API_KEY=abc123def456ghi789jkl012mno345pqr678

# External API Configuration - Kaggle
KAGGLE_API_KEY=1234567890abcdef1234567890abcdef
KAGGLE_USERNAME=yourusername

# Data Sync Configuration
SYNC_SCHEDULE=0 */6 * * *
SYNC_TIMEOUT=30000
SYNC_RETRIES=3

# Node Environment
NODE_ENV=development
```

---

## 🧪 Testing Your Configuration

After setting up your `.env` file:

1. **Test configuration parsing:**
   ```bash
   cd backend
   node -e "import('./src/utils/config.js').then(m => console.log('✅ Config valid!', m.loadConfig()))"
   ```

2. **Test database connection:**
   ```bash
   cd backend
   node test-db-connection.js
   ```

3. **Run migrations:**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

---

## 🚨 Common Issues & Solutions

### Issue: "DATABASE_URL environment variable is required"
**Solution:** Make sure your `.env` file is in the project root (not in `backend/` folder)

### Issue: "Connection refused" or "ECONNREFUSED"
**Solution:** 
- Check if PostgreSQL is running
- Verify the host and port in DATABASE_URL
- For cloud databases, check if your IP is whitelisted

### Issue: "JWT_SECRET must be at least 32 characters long"
**Solution:** Generate a longer secret using the commands above

### Issue: "Invalid URL" for DATABASE_URL
**Solution:** Ensure the URL format is correct:
```
postgresql://username:password@host:port/database
```

### Issue: Kaggle API not working
**Solution:** 
- Verify your API key is correct
- Check if you've accepted Kaggle's terms of service
- For development, you can use placeholder values initially

---

## 🎯 Recommended Setup for Development

**Best choice for getting started quickly:**

1. **Database:** Supabase (free, managed, easy setup)
2. **JWT Secret:** Generate with `openssl rand -hex 32`
3. **APIs:** 
   - Kontests.net: Use default URL (no key needed)
   - CLIST.by: Get free API key
   - Kaggle: Use placeholder initially, add real key later

This gets you up and running in ~10 minutes!

---

## 📚 Next Steps

After setting up your `.env` file:

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Run database migrations:
   ```bash
   cd backend
   npm run migrate
   ```

3. Start development servers:
   ```bash
   npm run dev
   ```

4. Access the application:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000
   - Health check: http://localhost:3000/api/health

---

## 🔒 Security Notes

- ✅ **Never commit `.env` to git** (it's in `.gitignore`)
- ✅ Use different secrets for development and production
- ✅ Rotate JWT_SECRET periodically in production
- ✅ Use environment variables in CI/CD (GitHub Secrets, etc.)
- ✅ Keep API keys secure and don't share them

---

Need help? Check the main README.md or create an issue in the repository!
