# Design Document: DevArena Platform

## Overview

DevArena is a full-stack web application that aggregates developer competitions from multiple external APIs into a unified platform. The system consists of four primary layers:

1. **Frontend Layer**: React-based SPA with Vite build tooling and TailwindCSS styling
2. **Backend Layer**: Express.js REST API server handling authentication, data operations, and business logic
3. **Data Layer**: PostgreSQL database with four core tables (users, competitions, bookmarks, sync_logs)
4. **Scheduler Layer**: Node-cron based service for automated data synchronization every 6 hours

The platform serves two user roles (user and admin) and integrates with three external competition APIs (Kontests.net, CLIST.by, Kaggle). The core value proposition is providing a single searchable hub for discovering competitions across multiple platforms with personalized bookmarking and comprehensive filtering.

### Key Design Principles

- **Separation of Concerns**: Clear boundaries between frontend, backend, data sync, and database layers
- **Stateless Authentication**: JWT-based authentication for scalability
- **Idempotent Sync**: Data synchronization handles duplicates gracefully through upsert operations
- **Fail-Safe Sync**: Individual API failures don't prevent other sources from syncing
- **Role-Based Access Control**: Admin-only endpoints for manual sync and competition management
- **Unified Schema**: Heterogeneous API responses normalized to consistent Competition model

## Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        Landing[Landing Page]
        Explore[Explore Page]
        Detail[Detail Page]
        Dashboard[Dashboard Page]
        Admin[Admin Page]
        Profile[Profile Page]
    end
    
    subgraph "Backend Layer"
        API[Express.js REST API]
        Auth[Authentication Service]
        Filter[Filter Engine]
        Aggregator[Competition Aggregator]
    end
    
    subgraph "Scheduler Layer"
        Cron[Node-cron Scheduler]
        Sync[Data Sync Service]
        Parser[API Response Parser]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL Database)]
    end
    
    subgraph "External APIs"
        Kontests[Kontests.net API]
        CLIST[CLIST.by API]
        Kaggle[Kaggle API]
    end
    
    Landing --> API
    Explore --> API
    Detail --> API
    Dashboard --> API
    Admin --> API
    Profile --> API
    
    API --> Auth
    API --> Filter
    API --> Aggregator
    API --> DB
    
    Cron --> Sync
    Sync --> Parser
    Parser --> Aggregator
    Aggregator --> DB
    
    Sync --> Kontests
    Sync --> CLIST
    Sync --> Kaggle
    
    Admin --> Sync
```

### Component Interaction Flow

**User Authentication Flow:**
1. User submits credentials to `/api/auth/login`
2. Authentication Service validates credentials against database
3. On success, generates JWT token with user id and role
4. Frontend stores token and includes in Authorization header for subsequent requests
5. Backend validates JWT on protected endpoints

**Data Synchronization Flow:**
1. Node-cron triggers Data Sync Service every 6 hours
2. Data Sync Service makes parallel requests to all three external APIs
3. API Response Parser transforms each response to unified Competition schema
4. Competition Aggregator performs upsert operations (update if exists, insert if new)
5. Sync Log entry created with timestamp, source, status, and record count
6. Individual API failures logged but don't block other sources

**Competition Filtering Flow:**
1. User applies filters on Explore page (category, status, location, deadline, prize, difficulty, source)
2. Frontend sends GET request to `/api/competitions` with query parameters
3. Filter Engine builds SQL WHERE clause with AND logic for multiple filters
4. Database executes query using indexes on category, status, and start_date
5. Paginated results returned to frontend
6. Frontend updates UI without full page reload

**Bookmark Management Flow:**
1. Authenticated user clicks bookmark button on competition
2. Frontend sends POST to `/api/bookmarks` with competition_id
3. Backend validates JWT, extracts user_id
4. Database creates bookmark record with unique constraint check
5. On success, frontend updates UI to show bookmarked state

## Components and Interfaces

### Frontend Components

#### 1. Landing Page Component
**Purpose**: Marketing page with platform overview and call-to-action

**Props**: None (public page)

**State**:
- None (stateless component)

**Key Functions**:
- `navigateToExplore()`: Redirects to /explore
- `navigateToRegister()`: Redirects to /register

**UI Elements**:
- Hero section with platform description
- Feature highlights (automated sync, multi-source aggregation, bookmarking)
- CTA buttons (Explore Competitions, Sign Up)

---

#### 2. Explore Page Component
**Purpose**: Main competition browsing interface with filtering

**Props**: None

**State**:
- `competitions: Competition[]` - List of competitions
- `filters: FilterState` - Active filter selections
- `loading: boolean` - Loading state
- `pagination: PaginationState` - Current page and total pages

**Key Functions**:
- `fetchCompetitions(filters, page)`: Calls GET /api/competitions with query params
- `applyFilter(filterType, value)`: Updates filter state and triggers fetch
- `clearFilters()`: Resets all filters to default
- `toggleBookmark(competitionId)`: Calls POST/DELETE /api/bookmarks

**UI Elements**:
- Filter sidebar (category, status, location, deadline, prize, difficulty, source)
- Search bar for text queries
- Competition card grid
- Pagination controls

**API Integration**:
```typescript
GET /api/competitions?category=Hackathons&status=upcoming&page=1&limit=20
```

---

#### 3. Detail Page Component
**Purpose**: Full competition information display

**Props**:
- `competitionId: string` (from route params)

**State**:
- `competition: Competition | null`
- `isBookmarked: boolean`
- `loading: boolean`

**Key Functions**:
- `fetchCompetitionDetails(id)`: Calls GET /api/competitions/:id
- `toggleBookmark()`: Calls POST/DELETE /api/bookmarks
- `navigateToSource()`: Opens competition.url in new tab

**UI Elements**:
- Competition title and description
- Metadata grid (category, platform, status, dates, location, prize, difficulty)
- Bookmark button
- External link button to original competition page

---

#### 4. Dashboard Page Component
**Purpose**: Personalized view of bookmarked competitions

**Props**: None (requires authentication)

**State**:
- `bookmarkedCompetitions: Competition[]`
- `loading: boolean`

**Key Functions**:
- `fetchBookmarks()`: Calls GET /api/bookmarks
- `removeBookmark(bookmarkId)`: Calls DELETE /api/bookmarks/:id
- `isDeadlineApproaching(endDate)`: Returns true if within 7 days

**UI Elements**:
- Bookmarked competitions list sorted by start_date
- Deadline warnings for competitions ending within 7 days
- Empty state message if no bookmarks
- Quick filter by status (upcoming, ongoing)

---

#### 5. Admin Page Component
**Purpose**: Administrative controls for sync and competition management

**Props**: None (requires admin role)

**State**:
- `syncLogs: SyncLog[]`
- `stats: { userCount, competitionCount, bookmarkCount }`
- `competitions: Competition[]`
- `syncing: boolean`

**Key Functions**:
- `triggerManualSync()`: Calls POST /api/admin/sync
- `fetchSyncLogs()`: Calls GET /api/admin/sync-logs
- `fetchStats()`: Calls GET /api/admin/stats
- `deleteCompetition(id)`: Calls DELETE /api/admin/competitions/:id
- `updateCompetition(id, data)`: Calls PUT /api/admin/competitions/:id

**UI Elements**:
- Manual sync trigger button
- Sync logs table (timestamp, source, status, record count, errors)
- Platform statistics dashboard
- Competition management table with edit/delete actions

**Access Control**:
- Route protected by admin role check
- Redirects to login if not authenticated
- Shows 403 error if authenticated but not admin

---

#### 6. Profile Page Component
**Purpose**: User account information and settings

**Props**: None (requires authentication)

**State**:
- `user: User`
- `editing: boolean`

**Key Functions**:
- `fetchUserProfile()`: Calls GET /api/users/me
- `updateProfile(data)`: Calls PUT /api/users/me
- `changePassword(oldPassword, newPassword)`: Calls POST /api/users/change-password

**UI Elements**:
- User information display (username, email, role, created_at)
- Edit profile form
- Change password form
- Account statistics (total bookmarks, account age)

---

### Backend Components

#### 1. Authentication Service
**Purpose**: Handle user registration, login, and JWT validation

**Module**: `src/services/authService.js`

**Functions**:

```javascript
async register(username, email, password)
  // Hash password with bcrypt (10 rounds)
  // Insert user record with role='user'
  // Return user object (without password_hash)

async login(email, password)
  // Query user by email
  // Compare password with bcrypt
  // Generate JWT with payload: { userId, role }
  // Return { token, user }

async validateToken(token)
  // Verify JWT signature and expiration
  // Return decoded payload or throw error

async hashPassword(password)
  // Use bcrypt.hash with salt rounds = 10

async comparePassword(password, hash)
  // Use bcrypt.compare
```

**Dependencies**:
- `bcrypt` for password hashing
- `jsonwebtoken` for JWT operations
- `pg` for database queries

**Configuration**:
- JWT_SECRET from environment
- Token expiration: 7 days

---

#### 2. Competition Aggregator
**Purpose**: Process and store competition data from external APIs

**Module**: `src/services/competitionAggregator.js`

**Functions**:

```javascript
async upsertCompetitions(competitions)
  // For each competition:
  //   Check if exists by unique key (title + platform + start_date)
  //   If exists: UPDATE with new data
  //   If not: INSERT new record
  // Return count of inserted and updated records

async updateCompetitionStatus()
  // Query all competitions
  // For each competition:
  //   If start_date > now: status = 'upcoming'
  //   If start_date <= now < end_date: status = 'ongoing'
  //   If end_date <= now: status = 'ended'
  // Batch update database

async deleteCompetition(id)
  // Delete competition by id
  // Cascade deletes bookmarks via foreign key constraint

async updateCompetition(id, data)
  // Update competition fields
  // Preserve original source field
```

**Database Operations**:
- Uses PostgreSQL UPSERT (INSERT ... ON CONFLICT ... DO UPDATE)
- Batch operations for efficiency
- Transaction support for data consistency

---

#### 3. Data Sync Service
**Purpose**: Orchestrate automated data fetching from external APIs

**Module**: `src/services/dataSyncService.js`

**Functions**:

```javascript
async syncAll()
  // Execute syncs in parallel using Promise.all
  // Call syncKontests(), syncCLIST(), syncKaggle()
  // Aggregate results and create sync logs
  // Return summary of sync operation

async syncKontests()
  // Fetch from KONTESTS_API_URL
  // Parse response with API Response Parser
  // Pass to Competition Aggregator
  // Create sync log entry
  // Handle errors gracefully

async syncCLIST()
  // Fetch from CLIST_API_URL with API key
  // Parse response with API Response Parser
  // Pass to Competition Aggregator
  // Create sync log entry
  // Handle errors gracefully

async syncKaggle()
  // Fetch from Kaggle API with API key
  // Parse response with API Response Parser
  // Pass to Competition Aggregator
  // Create sync log entry
  // Handle errors gracefully

async createSyncLog(source, status, recordCount, errorMessage)
  // Insert sync_logs record with timestamp
```

**Scheduler Integration**:
```javascript
// src/scheduler.js
const cron = require('node-cron');
const dataSyncService = require('./services/dataSyncService');

// Run every 6 hours: 0 */6 * * *
cron.schedule('0 */6 * * *', async () => {
  console.log('Starting scheduled sync...');
  await dataSyncService.syncAll();
});
```

**Error Handling**:
- Individual API failures don't block other sources
- Errors logged to sync_logs table with error_message
- Network timeouts set to 30 seconds
- Retry logic: 3 attempts with exponential backoff

---

#### 4. API Response Parser
**Purpose**: Transform heterogeneous API responses to unified Competition schema

**Module**: `src/parsers/apiResponseParser.js`

**Functions**:

```javascript
parseKontestsResponse(jsonResponse)
  // Map Kontests.net fields to Competition schema
  // Field mappings:
  //   name -> title
  //   url -> url
  //   start_time -> start_date (convert to ISO 8601)
  //   end_time -> end_date (convert to ISO 8601)
  //   site -> platform
  //   in_24_hours -> derive status
  // Set source = 'kontests'
  // Set category based on site name heuristics

parseCLISTResponse(jsonResponse)
  // Map CLIST.by fields to Competition schema
  // Field mappings:
  //   event -> title
  //   href -> url
  //   start -> start_date (convert to ISO 8601)
  //   end -> end_date (convert to ISO 8601)
  //   resource.name -> platform
  // Set source = 'clist'
  // Set category based on resource tags

parseKaggleResponse(jsonResponse)
  // Map Kaggle API fields to Competition schema
  // Field mappings:
  //   title -> title
  //   url -> url
  //   deadline -> end_date (convert to ISO 8601)
  //   category -> category (direct mapping)
  //   reward -> prize
  // Set source = 'kaggle'
  // Set platform = 'Kaggle'

normalizeDate(dateString)
  // Parse various date formats
  // Return ISO 8601 string (YYYY-MM-DDTHH:mm:ssZ)

inferCategory(platform, tags)
  // Heuristic mapping:
  //   CodeForces, LeetCode, HackerRank -> Competitive Programming
  //   Devpost, MLH -> Hackathons
  //   Kaggle, DrivenData -> AI/Data Science
  //   CTFtime, HackTheBox -> CTF/Security
  // Default: Competitive Programming
```

**Validation**:
- Required fields: title, url, start_date, end_date, platform, source
- Optional fields: description, location, prize, difficulty
- Invalid records logged and skipped

---

#### 5. Filter Engine
**Purpose**: Build dynamic SQL queries for competition filtering

**Module**: `src/services/filterEngine.js`

**Functions**:

```javascript
buildFilterQuery(filters)
  // Construct SQL WHERE clause from filter object
  // Filters:
  //   category: exact match
  //   status: exact match
  //   location: exact match or 'online'
  //   deadline: end_date BETWEEN now AND now + interval
  //   prize: prize >= minPrize
  //   difficulty: exact match
  //   source: exact match
  //   search: title ILIKE %query% OR description ILIKE %query%
  // Combine with AND logic
  // Return { query, params }

async executeFilter(filters, page, limit)
  // Build query with buildFilterQuery
  // Add pagination: OFFSET (page-1)*limit LIMIT limit
  // Add sorting: ORDER BY start_date ASC
  // Execute query
  // Return { competitions, totalCount, totalPages }
```

**Query Optimization**:
- Uses parameterized queries to prevent SQL injection
- Leverages indexes on category, status, start_date
- Full-text search on title and description (case-insensitive)

---

### API Endpoints

#### Authentication Endpoints

**POST /api/auth/register**
```json
Request:
{
  "username": "string",
  "email": "string",
  "password": "string"
}

Response (201):
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "role": "user",
    "created_at": "timestamp"
  }
}

Errors:
- 400: Invalid input (missing fields, invalid email format)
- 409: Username or email already exists
```

**POST /api/auth/login**
```json
Request:
{
  "email": "string",
  "password": "string"
}

Response (200):
{
  "token": "jwt_string",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "role": "user|admin"
  }
}

Errors:
- 400: Invalid input
- 401: Invalid credentials
```

---

#### Competition Endpoints

**GET /api/competitions**
```
Query Parameters:
- category: string (optional)
- status: string (optional)
- location: string (optional)
- deadline: string (optional, e.g., "7days", "30days")
- prize: number (optional, minimum prize)
- difficulty: string (optional)
- source: string (optional)
- search: string (optional)
- page: number (default: 1)
- limit: number (default: 20)

Response (200):
{
  "competitions": [Competition],
  "pagination": {
    "currentPage": number,
    "totalPages": number,
    "totalCount": number,
    "limit": number
  }
}
```

**GET /api/competitions/:id**
```json
Response (200):
{
  "competition": Competition
}

Errors:
- 404: Competition not found
```

---

#### Bookmark Endpoints (Authenticated)

**POST /api/bookmarks**
```json
Request:
{
  "competition_id": "uuid"
}

Response (201):
{
  "bookmark": {
    "id": "uuid",
    "user_id": "uuid",
    "competition_id": "uuid",
    "created_at": "timestamp"
  }
}

Errors:
- 401: Unauthorized (invalid/missing token)
- 404: Competition not found
- 409: Bookmark already exists
```

**DELETE /api/bookmarks/:id**
```json
Response (204): No content

Errors:
- 401: Unauthorized
- 404: Bookmark not found
- 403: Forbidden (bookmark belongs to different user)
```

**GET /api/bookmarks**
```json
Response (200):
{
  "bookmarks": [
    {
      "id": "uuid",
      "competition": Competition,
      "created_at": "timestamp"
    }
  ]
}

Errors:
- 401: Unauthorized
```

---

#### Admin Endpoints (Admin Role Required)

**POST /api/admin/sync**
```json
Response (200):
{
  "message": "Sync initiated",
  "results": {
    "kontests": { "status": "success", "count": number },
    "clist": { "status": "success", "count": number },
    "kaggle": { "status": "success", "count": number }
  }
}

Errors:
- 401: Unauthorized
- 403: Forbidden (not admin)
```

**GET /api/admin/sync-logs**
```json
Query Parameters:
- page: number (default: 1)
- limit: number (default: 50)

Response (200):
{
  "logs": [
    {
      "id": "uuid",
      "source": "string",
      "status": "success|error",
      "record_count": number,
      "error_message": "string|null",
      "synced_at": "timestamp"
    }
  ],
  "pagination": { ... }
}
```

**DELETE /api/admin/competitions/:id**
```json
Response (204): No content

Errors:
- 401: Unauthorized
- 403: Forbidden (not admin)
- 404: Competition not found
```

**PUT /api/admin/competitions/:id**
```json
Request:
{
  "title": "string",
  "description": "string",
  "category": "string",
  "status": "string",
  // ... other updatable fields
}

Response (200):
{
  "competition": Competition
}

Errors:
- 401: Unauthorized
- 403: Forbidden (not admin)
- 404: Competition not found
- 400: Invalid input
```

---

## Data Models

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin')),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
```

**Field Descriptions**:
- `id`: Unique identifier (UUID v4)
- `username`: Display name (3-50 characters)
- `email`: Login credential (must be valid email format)
- `password_hash`: Bcrypt hash (60 characters)
- `role`: Access level ('user' or 'admin')
- `created_at`: Account creation timestamp

---

#### Competitions Table
```sql
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  platform VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,
  location VARCHAR(100),
  prize VARCHAR(100),
  difficulty VARCHAR(20),
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_category CHECK (category IN (
    'Competitive Programming',
    'Hackathons',
    'AI/Data Science',
    'CTF/Security'
  )),
  CONSTRAINT valid_status CHECK (status IN ('upcoming', 'ongoing', 'ended')),
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT unique_competition UNIQUE (title, platform, start_date)
);

CREATE INDEX idx_competitions_category ON competitions(category);
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competitions_start_date ON competitions(start_date);
CREATE INDEX idx_competitions_source ON competitions(source);
CREATE INDEX idx_competitions_end_date ON competitions(end_date);
```

**Field Descriptions**:
- `id`: Unique identifier (UUID v4)
- `title`: Competition name
- `description`: Full description (optional)
- `category`: One of four predefined categories
- `platform`: Source platform (e.g., "CodeForces", "Kaggle")
- `url`: Link to original competition page
- `start_date`: Competition start time (ISO 8601)
- `end_date`: Competition end time (ISO 8601)
- `status`: Current state (upcoming/ongoing/ended)
- `location`: Physical location or "online" (optional)
- `prize`: Prize description (optional)
- `difficulty`: Difficulty level (optional)
- `source`: API source (kontests/clist/kaggle)
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp

**Unique Constraint**: Prevents duplicates based on (title, platform, start_date)

---

#### Bookmarks Table
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_bookmark UNIQUE (user_id, competition_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_competition_id ON bookmarks(competition_id);
```

**Field Descriptions**:
- `id`: Unique identifier (UUID v4)
- `user_id`: Foreign key to users table
- `competition_id`: Foreign key to competitions table
- `created_at`: Bookmark creation timestamp

**Constraints**:
- Unique constraint prevents duplicate bookmarks
- Cascade delete: Removing user or competition deletes associated bookmarks

---

#### Sync Logs Table
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_sync_status CHECK (status IN ('success', 'error', 'partial'))
);

CREATE INDEX idx_sync_logs_synced_at ON sync_logs(synced_at DESC);
CREATE INDEX idx_sync_logs_source ON sync_logs(source);
```

**Field Descriptions**:
- `id`: Unique identifier (UUID v4)
- `source`: API source name (kontests/clist/kaggle)
- `status`: Sync result (success/error/partial)
- `record_count`: Number of competitions processed
- `error_message`: Error details if status is error (optional)
- `synced_at`: Sync execution timestamp

---

### TypeScript Interfaces (Frontend)

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

interface Competition {
  id: string;
  title: string;
  description?: string;
  category: 'Competitive Programming' | 'Hackathons' | 'AI/Data Science' | 'CTF/Security';
  platform: string;
  url: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'ended';
  location?: string;
  prize?: string;
  difficulty?: string;
  source: 'kontests' | 'clist' | 'kaggle';
  created_at: string;
  updated_at: string;
}

interface Bookmark {
  id: string;
  user_id: string;
  competition_id: string;
  competition?: Competition;
  created_at: string;
}

interface SyncLog {
  id: string;
  source: string;
  status: 'success' | 'error' | 'partial';
  record_count: number;
  error_message?: string;
  synced_at: string;
}

interface FilterState {
  category?: string;
  status?: string;
  location?: string;
  deadline?: string;
  prize?: number;
  difficulty?: string;
  source?: string;
  search?: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}
```

---

### Configuration Model

```typescript
interface AppConfig {
  database: {
    url: string;
    poolSize: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  server: {
    port: number;
    corsOrigin: string;
  };
  apis: {
    kontests: {
      url: string;
    };
    clist: {
      url: string;
      apiKey: string;
    };
    kaggle: {
      apiKey: string;
      username: string;
    };
  };
  sync: {
    schedule: string; // cron expression
    timeout: number; // milliseconds
    retries: number;
  };
}
```

**.env File Format**:
```
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=your-secret-key-here
PORT=3000
CORS_ORIGIN=http://localhost:5173

KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
CLIST_API_KEY=your-clist-api-key

KAGGLE_API_KEY=your-kaggle-api-key
KAGGLE_USERNAME=your-kaggle-username

SYNC_SCHEDULE=0 */6 * * *
SYNC_TIMEOUT=30000
SYNC_RETRIES=3
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This platform includes two subsystems suitable for property-based testing: the Configuration Parser and the API Response Parser. Both involve data transformation with well-defined input/output relationships that can be verified through universal properties.

### Property 1: Configuration Validation

*For any* configuration input, if it is missing any required environment variable (DATABASE_URL, JWT_SECRET, PORT, KONTESTS_API_URL, CLIST_API_URL, KAGGLE_API_KEY), the Configuration_Parser SHALL return a descriptive error message identifying the missing variable.

**Validates: Requirements 11.3, 11.4**

### Property 2: Configuration Round-Trip Preservation

*For any* valid configuration object, serializing to .env format then parsing back SHALL produce an equivalent configuration object with all values preserved.

**Validates: Requirements 11.6**

### Property 3: Invalid JSON Error Handling

*For any* string that is not valid JSON, the API_Response_Parser SHALL return a descriptive error message rather than throwing an unhandled exception.

**Validates: Requirements 12.4**

### Property 4: Missing Fields Handling

*For any* Competition JSON object with missing optional fields, the API_Response_Parser SHALL either apply default values or skip the record with a warning, never producing invalid Competition objects.

**Validates: Requirements 12.5**

### Property 5: Date Format Normalization

*For any* valid date representation (Unix timestamp, ISO 8601 string, RFC 2822 string), the API_Response_Parser SHALL normalize it to ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ).

**Validates: Requirements 12.7**

### Property 6: Competition JSON Round-Trip Preservation

*For any* valid Competition object, serializing to JSON then parsing back SHALL produce an equivalent Competition object with all fields preserved.

**Validates: Requirements 12.8**

## Error Handling

### Error Categories

The system handles four primary error categories:

1. **Authentication Errors** (401, 403)
   - Invalid or expired JWT tokens
   - Missing authentication credentials
   - Insufficient permissions (non-admin accessing admin endpoints)

2. **Validation Errors** (400)
   - Missing required fields in request body
   - Invalid data types or formats
   - Constraint violations (duplicate username/email)

3. **Not Found Errors** (404)
   - Requested resource doesn't exist (competition, bookmark, user)
   - Invalid route

4. **Server Errors** (500)
   - Database connection failures
   - External API timeouts
   - Unhandled exceptions

### Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": {
      "field": "Additional context (optional)"
    }
  }
}
```

### Error Handling Strategies

#### Frontend Error Handling

**Network Errors**:
- Display user-friendly error messages
- Retry mechanism for transient failures (3 attempts with exponential backoff)
- Fallback to cached data when available

**Authentication Errors**:
- Clear stored JWT token
- Redirect to login page
- Preserve intended destination for post-login redirect

**Validation Errors**:
- Display field-specific error messages inline
- Highlight invalid fields in forms
- Prevent form submission until errors resolved

**Server Errors**:
- Display generic error message to user
- Log full error details to console for debugging
- Provide "Try Again" action

#### Backend Error Handling

**Database Errors**:
- Wrap all database operations in try-catch blocks
- Log full error stack trace
- Return generic 500 error to client (don't expose internal details)
- Implement connection pooling with retry logic

**External API Errors**:
- Set timeout for all external requests (30 seconds)
- Implement retry logic with exponential backoff (3 attempts)
- Log failed API calls with source and error details
- Continue sync process even if one API source fails
- Create sync_log entry with error status and message

**Validation Errors**:
- Use express-validator middleware for input validation
- Return 400 with specific field errors
- Validate at both frontend and backend (defense in depth)

**Authentication Errors**:
- Use middleware to validate JWT on protected routes
- Return 401 for invalid/expired tokens
- Return 403 for insufficient permissions
- Never expose password hashes in responses

### Logging Strategy

**Log Levels**:
- **ERROR**: Unhandled exceptions, database failures, external API failures
- **WARN**: Validation failures, missing optional data, rate limit approaching
- **INFO**: Successful sync operations, user registrations, admin actions
- **DEBUG**: Detailed request/response data (development only)

**Log Format**:
```json
{
  "timestamp": "ISO 8601 timestamp",
  "level": "ERROR|WARN|INFO|DEBUG",
  "service": "auth|sync|api|database",
  "message": "Log message",
  "context": {
    "userId": "uuid (if applicable)",
    "requestId": "uuid",
    "additionalData": {}
  }
}
```

**Log Storage**:
- Development: Console output with color coding
- Production: File-based logging with rotation (daily, max 30 days)
- Critical errors: Send to monitoring service (e.g., Sentry)

## Testing Strategy

### Testing Approach Overview

The DevArena platform requires a multi-layered testing strategy combining unit tests, property-based tests, integration tests, and end-to-end tests. The testing approach varies by component based on the nature of the functionality.

### Unit Testing

**Scope**: Individual functions and components with mocked dependencies

**Tools**:
- **Frontend**: Vitest + React Testing Library
- **Backend**: Jest + Supertest

**Coverage Targets**:
- Utility functions: 100%
- Business logic: 90%
- React components: 80%
- API routes: 85%

**Key Test Areas**:

1. **Authentication Service**
   - Password hashing produces valid bcrypt hashes
   - Password comparison correctly validates matches and rejects mismatches
   - JWT generation includes correct payload (userId, role)
   - JWT validation rejects expired tokens
   - JWT validation rejects tampered tokens

2. **Filter Engine**
   - Single filter produces correct SQL WHERE clause
   - Multiple filters combine with AND logic
   - Search query produces case-insensitive ILIKE clause
   - Pagination calculates correct OFFSET and LIMIT
   - Empty filters return all competitions

3. **Competition Aggregator**
   - Status calculation based on dates (upcoming/ongoing/ended)
   - Duplicate detection by (title, platform, start_date)
   - Upsert logic updates existing records
   - Upsert logic inserts new records

4. **React Components**
   - Components render without crashing
   - User interactions trigger correct callbacks
   - Conditional rendering based on props/state
   - Form validation displays error messages
   - Loading states display correctly

### Property-Based Testing

**Scope**: Configuration Parser and API Response Parser (Requirements 11 and 12)

**Tool**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Tests**:

Each property test must include a comment tag referencing the design document property:

```javascript
// Feature: devarena-platform, Property 1: Configuration Validation
test('missing required variables produce descriptive errors', () => {
  fc.assert(
    fc.property(
      fc.record({
        DATABASE_URL: fc.option(fc.string()),
        JWT_SECRET: fc.option(fc.string()),
        PORT: fc.option(fc.integer()),
        KONTESTS_API_URL: fc.option(fc.string()),
        CLIST_API_URL: fc.option(fc.string()),
        KAGGLE_API_KEY: fc.option(fc.string())
      }),
      (config) => {
        const missingVars = Object.entries(config)
          .filter(([_, value]) => value === null)
          .map(([key]) => key);
        
        if (missingVars.length > 0) {
          const result = parseConfig(config);
          expect(result.error).toBeDefined();
          missingVars.forEach(varName => {
            expect(result.error.message).toContain(varName);
          });
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: devarena-platform, Property 2: Configuration Round-Trip Preservation
test('config round-trip preserves all values', () => {
  fc.assert(
    fc.property(
      validConfigGenerator(),
      (config) => {
        const envString = formatConfigToEnv(config);
        const parsedConfig = parseEnvToConfig(envString);
        expect(parsedConfig).toEqual(config);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: devarena-platform, Property 3: Invalid JSON Error Handling
test('invalid JSON produces descriptive errors', () => {
  fc.assert(
    fc.property(
      invalidJsonGenerator(),
      (invalidJson) => {
        const result = parseApiResponse(invalidJson);
        expect(result.error).toBeDefined();
        expect(result.error.message).toMatch(/invalid json|parse error/i);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: devarena-platform, Property 4: Missing Fields Handling
test('missing optional fields handled gracefully', () => {
  fc.assert(
    fc.property(
      competitionWithMissingFieldsGenerator(),
      (partialCompetition) => {
        const result = parseCompetition(partialCompetition);
        // Either valid competition with defaults or skip with warning
        if (result.competition) {
          expect(result.competition).toHaveProperty('title');
          expect(result.competition).toHaveProperty('url');
          expect(result.competition).toHaveProperty('start_date');
        } else {
          expect(result.warning).toBeDefined();
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: devarena-platform, Property 5: Date Format Normalization
test('various date formats normalize to ISO 8601', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.integer({ min: 0, max: 2147483647 }), // Unix timestamp
        fc.date().map(d => d.toISOString()), // ISO 8601
        fc.date().map(d => d.toUTCString()) // RFC 2822
      ),
      (dateInput) => {
        const normalized = normalizeDate(dateInput);
        expect(normalized).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: devarena-platform, Property 6: Competition JSON Round-Trip Preservation
test('competition JSON round-trip preserves all fields', () => {
  fc.assert(
    fc.property(
      validCompetitionGenerator(),
      (competition) => {
        const json = JSON.stringify(competition);
        const parsed = parseCompetitionJson(json);
        expect(parsed).toEqual(competition);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Custom Generators**:

```javascript
// Generator for valid configuration objects
const validConfigGenerator = () => fc.record({
  DATABASE_URL: fc.string({ minLength: 10 }),
  JWT_SECRET: fc.string({ minLength: 32 }),
  PORT: fc.integer({ min: 1024, max: 65535 }),
  KONTESTS_API_URL: fc.webUrl(),
  CLIST_API_URL: fc.webUrl(),
  KAGGLE_API_KEY: fc.string({ minLength: 20 })
});

// Generator for invalid JSON strings
const invalidJsonGenerator = () => fc.oneof(
  fc.constant('{invalid}'),
  fc.constant('{"unclosed": '),
  fc.constant('null,'),
  fc.string().filter(s => {
    try { JSON.parse(s); return false; }
    catch { return true; }
  })
);

// Generator for valid competitions
const validCompetitionGenerator = () => fc.record({
  title: fc.string({ minLength: 1, maxLength: 255 }),
  description: fc.option(fc.string()),
  category: fc.constantFrom(
    'Competitive Programming',
    'Hackathons',
    'AI/Data Science',
    'CTF/Security'
  ),
  platform: fc.string({ minLength: 1 }),
  url: fc.webUrl(),
  start_date: fc.date().map(d => d.toISOString()),
  end_date: fc.date().map(d => d.toISOString()),
  status: fc.constantFrom('upcoming', 'ongoing', 'ended'),
  location: fc.option(fc.string()),
  prize: fc.option(fc.string()),
  difficulty: fc.option(fc.string()),
  source: fc.constantFrom('kontests', 'clist', 'kaggle')
});

// Generator for competitions with missing fields
const competitionWithMissingFieldsGenerator = () => {
  return validCompetitionGenerator().chain(comp => {
    return fc.record({
      ...Object.fromEntries(
        Object.entries(comp).map(([key, value]) => 
          [key, fc.option(fc.constant(value))]
        )
      )
    });
  });
};
```

### Integration Testing

**Scope**: Multi-component interactions with real database (test instance)

**Tools**: Jest + Supertest + PostgreSQL test database

**Test Database Setup**:
- Use separate test database
- Reset schema before each test suite
- Seed with minimal test data
- Clean up after tests

**Key Integration Test Areas**:

1. **Authentication Flow**
   - Register user → verify database record created
   - Login → verify JWT token valid
   - Protected endpoint → verify JWT validation
   - Admin endpoint → verify role check

2. **Bookmark Flow**
   - Create bookmark → verify database record
   - Fetch bookmarks → verify competition data joined
   - Delete bookmark → verify cascade behavior
   - Duplicate bookmark → verify unique constraint

3. **Data Sync Flow**
   - Trigger sync → verify competitions inserted
   - Duplicate sync → verify upsert behavior
   - Failed API → verify error logged, other sources continue
   - Sync log → verify record created

4. **Filter Flow**
   - Apply filters → verify correct SQL query
   - Multiple filters → verify AND logic
   - Search query → verify case-insensitive match
   - Pagination → verify correct page returned

### End-to-End Testing

**Scope**: Full user workflows through browser

**Tools**: Playwright

**Test Scenarios**:

1. **User Registration and Login**
   - Navigate to landing page
   - Click "Sign Up"
   - Fill registration form
   - Submit and verify redirect to dashboard
   - Logout
   - Login with credentials
   - Verify dashboard loads

2. **Competition Discovery**
   - Navigate to Explore page
   - Apply category filter
   - Apply status filter
   - Enter search query
   - Verify filtered results
   - Click competition card
   - Verify detail page loads

3. **Bookmark Management**
   - Login as user
   - Navigate to competition detail
   - Click bookmark button
   - Navigate to dashboard
   - Verify competition appears in bookmarks
   - Click remove bookmark
   - Verify competition removed

4. **Admin Workflow**
   - Login as admin
   - Navigate to admin panel
   - Trigger manual sync
   - Verify sync logs update
   - Edit competition
   - Verify changes saved
   - Delete competition
   - Verify competition removed

### Test Data Management

**Fixtures**:
- Sample users (regular and admin)
- Sample competitions (all categories, all statuses)
- Sample API responses (Kontests, CLIST, Kaggle)

**Factories**:
- User factory with customizable fields
- Competition factory with randomization
- Bookmark factory linking users and competitions

**Mocking Strategy**:
- Mock external API calls in unit tests
- Use real database in integration tests
- Mock authentication in component tests
- Use test JWT tokens with short expiration

### Continuous Integration

**CI Pipeline**:
1. Lint code (ESLint, Prettier)
2. Run unit tests (frontend and backend)
3. Run property-based tests (100 iterations)
4. Run integration tests (with test database)
5. Generate coverage report (fail if below thresholds)
6. Build frontend and backend
7. Run E2E tests (headless browser)

**Coverage Requirements**:
- Overall: 85%
- Critical paths (auth, sync, filters): 95%
- Property-based tests: 100% of identified properties

### Manual Testing Checklist

**Pre-Release Verification**:
- [ ] All three external APIs successfully sync
- [ ] Admin can manually trigger sync
- [ ] Filters work in all combinations
- [ ] Bookmarks persist across sessions
- [ ] JWT expiration handled gracefully
- [ ] Mobile responsive design verified
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] Performance: Page load < 2 seconds
- [ ] Performance: Filter response < 500ms
- [ ] Accessibility: Keyboard navigation works
- [ ] Accessibility: Screen reader compatible

