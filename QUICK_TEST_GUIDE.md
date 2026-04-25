# Quick Test Guide - Database Connection

## ✅ Fixed the Issue!

The problem was that `dotenv.config()` was looking for `.env` in the wrong directory. I've updated the code to always look in the project root.

## 🧪 Test Your Database Connection

### From the backend directory:

```powershell
cd backend
node test-db-connection.js
```

### Or from the project root:

```powershell
node backend/test-db-connection.js
```

## ✅ Expected Output

If everything works, you should see:

```
Testing database connection...

1. Initializing connection pool...
✓ Pool initialized successfully

2. Testing database connection...
Database connection successful { timestamp: 2024-01-15T10:30:00.000Z }
✓ Database connection successful

3. Executing simple query...
✓ Query executed successfully
  Result: { number: 1, timestamp: 2024-01-15T10:30:00.000Z }

4. Executing parameterized query...
✓ Parameterized query executed successfully
  Result: { message: 'Hello from DevArena', count: 42 }

5. Getting client from pool...
✓ Client acquired from pool

6. Executing query with client...
✓ Client query executed successfully
  PostgreSQL version: PostgreSQL 15.1 on x86_64-pc-linux-gnu...

✓ Client released back to pool

7. Testing transaction...
✓ Transaction completed successfully

8. Closing connection pool...
✓ Pool closed successfully

==================================================
All tests passed! ✓
==================================================
```

## 🚨 Common Errors & Solutions

### Error: "DATABASE_URL environment variable is required"
**Solution:** Make sure your `.env` file is in the project root (`C:\antigravity\dev-arena\.env`)

### Error: "password authentication failed"
**Solution:** Your Supabase password is wrong. Reset it in Supabase dashboard:
1. Go to Settings → Database
2. Click "Reset Database Password"
3. Update your `.env` file with the new password

### Error: "Connection refused" or "ECONNREFUSED"
**Solution:** 
- Check if your Supabase project is active
- Verify the connection string is correct
- Check if your IP is whitelisted (Supabase usually allows all IPs by default)

### Error: "timeout"
**Solution:**
- Check your internet connection
- Verify the Supabase host is correct
- Try increasing the timeout in db.js

## 🎯 Your Current Configuration

Based on your `.env` file:

```
Database: Supabase (gsjndfnqktnstmfvahcu)
Username: postgres
Database: postgres
Port: 5432
```

## 🔧 Next Steps After Successful Test

1. **Run migrations** to create tables:
   ```powershell
   cd backend
   npm run migrate
   ```

2. **Verify tables were created**:
   - Go to Supabase dashboard
   - Click "Table Editor"
   - You should see: users, competitions, bookmarks, sync_logs

3. **Start the development server**:
   ```powershell
   cd ..
   npm run dev
   ```

## 💡 Pro Tip

If you want to test the connection quickly without all the detailed tests:

```powershell
cd backend
node -e "import('./src/utils/db.js').then(m => m.default.testConnection().then(() => console.log('✅ Connected!')))"
```

This runs a quick connection test in one line!
