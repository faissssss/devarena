# Kontests API Issue - Workaround Guide

## ⚠️ Problem

The Kontests.net API (`https://kontests.net/api/v1/all`) appears to be down or experiencing connectivity issues. This is a known issue that has occurred before (see [GitHub Issue #72](https://github.com/AliOsm/kontests/issues/72)).

## ✅ Solution: Use CLIST.by as Primary Source

CLIST.by is more reliable and has better coverage. Here's how to set it up:

### Step 1: Get CLIST API Key (Free)

1. Go to [clist.by](https://clist.by/)
2. Click **Sign Up** (top right)
3. Create a free account
4. Go to **Settings** → **API**
5. Click **Generate API Key**
6. Copy your API key

### Step 2: Update Your .env File

```env
# Use CLIST as primary source (more reliable)
CLIST_API_URL=https://clist.by/api/v4/contest/
CLIST_API_KEY=your-actual-api-key-here

# Keep Kontests URL (will retry if it comes back online)
KONTESTS_API_URL=https://kontests.net/api/v1/all

# Kaggle (optional for now)
KAGGLE_API_KEY=placeholder-for-development
KAGGLE_USERNAME=placeholder
```

### Step 3: Test CLIST API

**PowerShell (Windows):**
```powershell
# Replace YOUR_API_KEY with your actual key
$headers = @{
    "Authorization" = "ApiKey YOUR_USERNAME:YOUR_API_KEY"
}
Invoke-WebRequest -Uri "https://clist.by/api/v4/contest/?limit=5" -Headers $headers
```

**Or use this simpler test:**
```powershell
# Just check if the API is reachable
Invoke-WebRequest -Uri "https://clist.by/api/v4/contest/?limit=1"
```

## 🎯 For Your .env File Right Now

**Minimal working configuration:**

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-generated-32-character-secret-here

# Server
PORT=3000
CORS_ORIGIN=http://localhost:5173

# CLIST (Primary source - GET YOUR KEY FROM clist.by)
CLIST_API_URL=https://clist.by/api/v4/contest/
CLIST_API_KEY=your-clist-api-key-here

# Kontests (Keep this, will retry automatically)
KONTESTS_API_URL=https://kontests.net/api/v1/all

# Kaggle (Optional - use placeholders for now)
KAGGLE_API_KEY=placeholder-key
KAGGLE_USERNAME=placeholder-user

# Sync settings
SYNC_SCHEDULE=0 */6 * * *
SYNC_TIMEOUT=30000
SYNC_RETRIES=3

NODE_ENV=development
```

## 🔧 Code Changes Needed

The backend code already has retry logic, so if Kontests comes back online, it will automatically start working again. The sync service will:

1. Try to fetch from all three sources
2. If Kontests fails, it logs the error but continues with CLIST and Kaggle
3. Successful data from CLIST will still populate your database

**No code changes needed!** The error handling is already built in.

## 📊 API Comparison

| API | Status | Free Tier | API Key Required | Coverage |
|-----|--------|-----------|------------------|----------|
| **CLIST.by** | ✅ Working | Yes (1000 req/day) | Yes | 300+ platforms |
| **Kontests.net** | ❌ Down | Yes | No | ~15 platforms |
| **Kaggle** | ✅ Working | Yes | Yes | Kaggle only |

## 🚀 Quick Start Commands

### 1. Generate JWT Secret
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Test Database Connection
```powershell
cd backend
node test-db-connection.js
```

### 3. Run Migrations
```powershell
cd backend
npm run migrate
```

### 4. Start Development Server
```powershell
npm run dev
```

## 💡 Pro Tips

1. **CLIST is actually better** - It has more platforms and better data quality
2. **Kontests might come back** - Keep the URL in your .env, the retry logic will handle it
3. **Start with CLIST only** - You can add Kaggle later when you need ML competitions
4. **Free tier is generous** - CLIST gives you 1000 requests/day, more than enough for development

## 🆘 Still Having Issues?

If CLIST also doesn't work:

1. **Check your internet connection**
2. **Try from a different network** (some corporate networks block APIs)
3. **Use a VPN** if your region blocks these services
4. **Start with mock data** - We can create a mock data file for development

## ✅ What You Need Right Now

**Minimum to get started:**

1. ✅ Supabase DATABASE_URL (from Supabase dashboard)
2. ✅ JWT_SECRET (generate with command above)
3. ✅ CLIST_API_KEY (free from clist.by)
4. ⏳ Kaggle (can add later)
5. ⏳ Kontests (will work when it's back online)

**You can start developing with just CLIST as your data source!**
