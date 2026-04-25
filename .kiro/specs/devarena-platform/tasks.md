# Implementation Plan: DevArena Platform

## Overview

This implementation plan breaks down the DevArena platform into sequential, actionable tasks. The platform is a full-stack web application with:
- **Frontend**: React + Vite + TailwindCSS (6 pages)
- **Backend**: Express.js with 5 core services
- **Database**: PostgreSQL with 4 tables
- **Scheduler**: node-cron for automated sync
- **Testing**: Unit, property-based (6 properties), integration, E2E

The implementation follows a bottom-up approach: database → backend services → API endpoints → frontend components → integration → testing.

## Tasks

- [x] 1. Project setup and configuration
  - Initialize monorepo structure with frontend and backend directories
  - Set up package.json for both frontend (React + Vite + TailwindCSS) and backend (Express.js)
  - Create .env.example file with all required environment variables
  - Set up ESLint and Prettier for code quality
  - Initialize Git repository with .gitignore
  - _Requirements: 11.1, 11.2, 11.4_

- [x] 2. Database schema and migrations
  - [x] 2.1 Create PostgreSQL database schema
    - Write SQL migration for users table with constraints and indexes
    - Write SQL migration for competitions table with constraints and indexes
    - Write SQL migration for bookmarks table with foreign keys and cascade deletes
    - Write SQL migration for sync_logs table with indexes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_
  
  - [x] 2.2 Create database connection module
    - Implement PostgreSQL connection pool using pg library
    - Parse DATABASE_URL from environment variables
    - Add connection error handling and retry logic
    - _Requirements: 11.7_

- [ ] 3. Configuration parser and environment management
  - [x] 3.1 Implement configuration parser
    - Create parseEnvToConfig function that loads .env file
    - Validate all required environment variables (DATABASE_URL, JWT_SECRET, PORT, API URLs, API keys)
    - Return descriptive error messages for missing variables
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [x] 3.2 Implement configuration formatter
    - Create formatConfigToEnv function that serializes config object to .env format
    - _Requirements: 11.5_
  
  - [x] 3.3 Write property test for configuration validation
    - **Property 1: Configuration Validation**
    - **Validates: Requirements 11.3, 11.4**
    - Test that missing required variables produce descriptive error messages
    - Use fast-check to generate configs with missing variables
  
  - [x] 3.4 Write property test for configuration round-trip
    - **Property 2: Configuration Round-Trip Preservation**
    - **Validates: Requirements 11.6**
    - Test that parsing then formatting then parsing preserves all values
    - Use fast-check to generate valid configuration objects

- [ ] 4. Authentication service
  - [x] 4.1 Implement password hashing and validation
    - Create hashPassword function using bcrypt with 10 salt rounds
    - Create comparePassword function using bcrypt.compare
    - _Requirements: 3.1_
  
  - [x] 4.2 Implement JWT token generation and validation
    - Create generateToken function with payload (userId, role) and 7-day expiration
    - Create validateToken function that verifies signature and expiration
    - Use JWT_SECRET from environment
    - _Requirements: 3.2, 3.4, 3.5_
  
  - [x] 4.3 Implement user registration
    - Create register function that hashes password and inserts user record
    - Assign "user" role by default
    - Enforce unique constraints on username and email
    - Return user object without password_hash
    - _Requirements: 3.1, 3.6, 3.7, 3.8_
  
  - [x] 4.4 Implement user login
    - Create login function that validates credentials
    - Generate JWT token on successful authentication
    - Return token and user object
    - _Requirements: 3.2_
  
  - [x] 4.5 Write unit tests for authentication service
    - Test password hashing produces valid bcrypt hashes
    - Test password comparison validates matches and rejects mismatches
    - Test JWT generation includes correct payload
    - Test JWT validation rejects expired and tampered tokens
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 5. API response parser
  - [x] 5.1 Implement date normalization
    - Create normalizeDate function that handles Unix timestamps, ISO 8601, and RFC 2822
    - Return ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
    - _Requirements: 12.7_
  
  - [x] 5.2 Implement category inference
    - Create inferCategory function with platform/tag heuristics
    - Map platforms to categories (CodeForces→Competitive Programming, Kaggle→AI/Data Science, etc.)
    - Default to Competitive Programming
    - _Requirements: 2.2_
  
  - [x] 5.3 Implement Kontests.net parser
    - Create parseKontestsResponse function
    - Map fields: name→title, url→url, start_time→start_date, end_time→end_date, site→platform
    - Set source='kontests' and infer category
    - Handle invalid JSON with descriptive errors
    - _Requirements: 12.1, 12.4, 12.6_
  
  - [x] 5.4 Implement CLIST.by parser
    - Create parseCLISTResponse function
    - Map fields: event→title, href→url, start→start_date, end→end_date, resource.name→platform
    - Set source='clist' and infer category from tags
    - Handle invalid JSON with descriptive errors
    - _Requirements: 12.2, 12.4, 12.6_
  
  - [x] 5.5 Implement Kaggle parser
    - Create parseKaggleResponse function
    - Map fields: title→title, url→url, deadline→end_date, category→category, reward→prize
    - Set source='kaggle' and platform='Kaggle'
    - Handle invalid JSON with descriptive errors
    - _Requirements: 12.3, 12.4, 12.6_
  
  - [x] 5.6 Write property test for invalid JSON handling
    - **Property 3: Invalid JSON Error Handling**
    - **Validates: Requirements 12.4**
    - Test that invalid JSON produces descriptive errors without throwing exceptions
    - Use fast-check to generate invalid JSON strings
  
  - [x] 5.7 Write property test for missing fields handling
    - **Property 4: Missing Fields Handling**
    - **Validates: Requirements 12.5**
    - Test that missing optional fields are handled with defaults or warnings
    - Use fast-check to generate competitions with missing fields
  
  - [x] 5.8 Write property test for date normalization
    - **Property 5: Date Format Normalization**
    - **Validates: Requirements 12.7**
    - Test that various date formats normalize to ISO 8601
    - Use fast-check to generate Unix timestamps, ISO 8601, and RFC 2822 dates
  
  - [x] 5.9 Write property test for competition JSON round-trip
    - **Property 6: Competition JSON Round-Trip Preservation**
    - **Validates: Requirements 12.8**
    - Test that serializing to JSON then parsing preserves all fields
    - Use fast-check to generate valid competition objects

- [ ] 6. Competition aggregator service
  - [x] 6.1 Implement competition status calculation
    - Create updateCompetitionStatus function
    - Set status based on dates: upcoming (start_date > now), ongoing (start_date ≤ now < end_date), ended (end_date ≤ now)
    - _Requirements: 2.3, 2.4, 2.5_
  
  - [x] 6.2 Implement competition upsert logic
    - Create upsertCompetitions function
    - Use PostgreSQL INSERT ... ON CONFLICT (title, platform, start_date) DO UPDATE
    - Return counts of inserted and updated records
    - _Requirements: 1.6, 1.9_
  
  - [x] 6.3 Implement competition CRUD operations
    - Create deleteCompetition function (cascade deletes bookmarks)
    - Create updateCompetition function (preserve original source)
    - _Requirements: 7.5, 7.6_
  
  - [x] 6.4 Write unit tests for competition aggregator
    - Test status calculation for various date combinations
    - Test duplicate detection by (title, platform, start_date)
    - Test upsert updates existing records
    - Test upsert inserts new records
    - _Requirements: 2.3, 2.4, 2.5, 1.9_

- [ ] 7. Data sync service
  - [x] 7.1 Implement sync log creation
    - Create createSyncLog function
    - Insert sync_logs record with source, status, record_count, error_message, timestamp
    - _Requirements: 1.7_
  
  - [x] 7.2 Implement Kontests.net sync
    - Create syncKontests function
    - Fetch from KONTESTS_API_URL with 30-second timeout
    - Parse response with parseKontestsResponse
    - Pass to Competition Aggregator upsertCompetitions
    - Create sync log entry
    - Handle errors gracefully without throwing
    - _Requirements: 1.2, 1.5, 1.6, 1.7, 1.8_
  
  - [x] 7.3 Implement CLIST.by sync
    - Create syncCLIST function
    - Fetch from CLIST_API_URL with API key header and 30-second timeout
    - Parse response with parseCLISTResponse
    - Pass to Competition Aggregator upsertCompetitions
    - Create sync log entry
    - Handle errors gracefully without throwing
    - _Requirements: 1.3, 1.5, 1.6, 1.7, 1.8_
  
  - [x] 7.4 Implement Kaggle sync
    - Create syncKaggle function
    - Fetch from Kaggle API with API key authentication and 30-second timeout
    - Parse response with parseKaggleResponse
    - Pass to Competition Aggregator upsertCompetitions
    - Create sync log entry
    - Handle errors gracefully without throwing
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8_
  
  - [x] 7.5 Implement parallel sync orchestration
    - Create syncAll function
    - Execute syncKontests, syncCLIST, syncKaggle in parallel using Promise.all
    - Aggregate results and return summary
    - Ensure individual failures don't block other sources
    - _Requirements: 1.8_
  
  - [x]* 7.6 Write integration tests for data sync
    - Test successful sync creates competitions and sync logs
    - Test duplicate sync performs upsert correctly
    - Test failed API logs error but continues with other sources
    - Use mocked API responses
    - _Requirements: 1.2, 1.3, 1.4, 1.7, 1.8, 1.9_

- [x] 8. Checkpoint - Ensure all backend services pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Filter engine service
  - [x] 9.1 Implement SQL query builder
    - Create buildFilterQuery function
    - Build WHERE clause for category, status, location, deadline, prize, difficulty, source filters
    - Combine multiple filters with AND logic
    - Support case-insensitive text search on title and description (ILIKE)
    - Return parameterized query with params array
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_
  
  - [x] 9.2 Implement filter execution with pagination
    - Create executeFilter function
    - Add pagination: OFFSET (page-1)*limit LIMIT limit
    - Add sorting: ORDER BY start_date ASC
    - Execute query and return { competitions, totalCount, totalPages }
    - _Requirements: 8.3_
  
  - [x]* 9.3 Write unit tests for filter engine
    - Test single filter produces correct WHERE clause
    - Test multiple filters combine with AND logic
    - Test search query produces case-insensitive ILIKE clause
    - Test pagination calculates correct OFFSET and LIMIT
    - Test empty filters return all competitions
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [ ] 10. REST API endpoints - Authentication
  - [x] 10.1 Implement POST /api/auth/register endpoint
    - Accept username, email, password in request body
    - Validate input (required fields, email format)
    - Call authService.register
    - Return 201 with user object (without password_hash)
    - Handle errors: 400 (invalid input), 409 (duplicate username/email)
    - _Requirements: 8.1, 8.13_
  
  - [x] 10.2 Implement POST /api/auth/login endpoint
    - Accept email, password in request body
    - Validate input
    - Call authService.login
    - Return 200 with JWT token and user object
    - Handle errors: 400 (invalid input), 401 (invalid credentials)
    - _Requirements: 8.2, 8.13_
  
  - [x] 10.3 Implement JWT authentication middleware
    - Extract token from Authorization header (Bearer scheme)
    - Validate token using authService.validateToken
    - Attach user payload to request object
    - Return 401 for invalid/missing token
    - _Requirements: 8.12_
  
  - [x] 10.4 Implement admin role authorization middleware
    - Check user.role === 'admin'
    - Return 403 if not admin
    - _Requirements: 7.2_

- [ ] 11. REST API endpoints - Competitions
  - [x] 11.1 Implement GET /api/competitions endpoint
    - Accept query parameters: category, status, location, deadline, prize, difficulty, source, search, page, limit
    - Call filterEngine.executeFilter with query params
    - Return 200 with paginated competitions and pagination metadata
    - _Requirements: 8.3_
  
  - [x] 11.2 Implement GET /api/competitions/:id endpoint
    - Extract id from route params
    - Query competition by id from database
    - Return 200 with competition object
    - Handle error: 404 (competition not found)
    - _Requirements: 8.4_

- [ ] 12. REST API endpoints - Bookmarks
  - [x] 12.1 Implement POST /api/bookmarks endpoint
    - Require authentication middleware
    - Accept competition_id in request body
    - Extract user_id from JWT payload
    - Insert bookmark record with unique constraint check
    - Return 201 with bookmark object
    - Handle errors: 401 (unauthorized), 404 (competition not found), 409 (duplicate bookmark)
    - _Requirements: 4.1, 4.5, 8.5_
  
  - [x] 12.2 Implement DELETE /api/bookmarks/:id endpoint
    - Require authentication middleware
    - Extract bookmark id from route params
    - Verify bookmark belongs to authenticated user
    - Delete bookmark record
    - Return 204 (no content)
    - Handle errors: 401 (unauthorized), 404 (bookmark not found), 403 (forbidden)
    - _Requirements: 4.2, 8.6_
  
  - [x] 12.3 Implement GET /api/bookmarks endpoint
    - Require authentication middleware
    - Extract user_id from JWT payload
    - Query bookmarks with joined competition data
    - Sort by competition start_date ascending
    - Return 200 with array of bookmarks with competition objects
    - Handle error: 401 (unauthorized)
    - _Requirements: 4.3, 6.2, 6.4, 8.7_
  
  - [x]* 12.4 Write integration tests for bookmark flow
    - Test create bookmark creates database record
    - Test fetch bookmarks returns competition data joined
    - Test delete bookmark removes record
    - Test duplicate bookmark returns 409 error
    - Use test database with seeded data
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 13. REST API endpoints - Admin
  - [x] 13.1 Implement POST /api/admin/sync endpoint
    - Require authentication and admin authorization middleware
    - Call dataSyncService.syncAll
    - Return 200 with sync results summary
    - Handle errors: 401 (unauthorized), 403 (forbidden)
    - _Requirements: 7.3, 8.8_
  
  - [x] 13.2 Implement GET /api/admin/sync-logs endpoint
    - Require authentication and admin authorization middleware
    - Accept query parameters: page, limit
    - Query sync_logs with pagination, sorted by synced_at DESC
    - Return 200 with paginated sync logs
    - Handle errors: 401 (unauthorized), 403 (forbidden)
    - _Requirements: 7.4, 8.9_
  
  - [x] 13.3 Implement DELETE /api/admin/competitions/:id endpoint
    - Require authentication and admin authorization middleware
    - Extract id from route params
    - Call competitionAggregator.deleteCompetition
    - Return 204 (no content)
    - Handle errors: 401 (unauthorized), 403 (forbidden), 404 (competition not found)
    - _Requirements: 7.5, 8.10_
  
  - [x] 13.4 Implement PUT /api/admin/competitions/:id endpoint
    - Require authentication and admin authorization middleware
    - Extract id from route params and update data from request body
    - Validate input
    - Call competitionAggregator.updateCompetition
    - Return 200 with updated competition object
    - Handle errors: 401 (unauthorized), 403 (forbidden), 404 (competition not found), 400 (invalid input)
    - _Requirements: 7.6, 8.11, 8.13_
  
  - [x]* 13.5 Write integration tests for admin endpoints
    - Test admin can trigger sync and view logs
    - Test non-admin receives 403 error
    - Test admin can update and delete competitions
    - Use test database with admin and regular user accounts
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 14. Node-cron scheduler setup
  - [x] 14.1 Implement cron scheduler
    - Create scheduler.js module
    - Use node-cron to schedule syncAll every 6 hours (cron: '0 */6 * * *')
    - Log scheduled sync start and completion
    - _Requirements: 1.1_
  
  - [x] 14.2 Integrate scheduler with Express server
    - Import and start scheduler when server starts
    - Ensure scheduler runs independently of HTTP requests
    - _Requirements: 1.1_

- [x] 15. Checkpoint - Ensure all backend tests pass and API is functional
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Frontend project setup
  - [x] 16.1 Initialize React + Vite project
    - Create frontend directory with Vite template
    - Install dependencies: react, react-dom, react-router-dom, axios
    - Configure Vite for development and production builds
    - _Requirements: 9.9_
  
  - [x] 16.2 Set up TailwindCSS
    - Install and configure TailwindCSS
    - Create base styles and theme configuration
    - _Requirements: 9.10_
  
  - [x] 16.3 Set up routing
    - Configure React Router with routes: /, /explore, /competitions/:id, /dashboard, /admin, /profile, /login, /register
    - Implement protected routes for authenticated pages
    - Implement admin-only routes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 16.4 Create API client module
    - Create axios instance with base URL
    - Implement request interceptor to attach JWT token from localStorage
    - Implement response interceptor to handle 401 errors (redirect to login)
    - Create API functions for all endpoints
    - _Requirements: 8.12_

- [ ] 17. Frontend - Authentication components
  - [x] 17.1 Create Login page component
    - Build login form with email and password fields
    - Implement form validation
    - Call POST /api/auth/login on submit
    - Store JWT token in localStorage
    - Redirect to dashboard on success
    - Display error messages on failure
    - _Requirements: 8.2_
  
  - [x] 17.2 Create Register page component
    - Build registration form with username, email, password fields
    - Implement form validation (email format, password strength)
    - Call POST /api/auth/register on submit
    - Redirect to login page on success
    - Display error messages on failure
    - _Requirements: 8.1_
  
  - [x] 17.3 Implement authentication context
    - Create AuthContext with user state and login/logout functions
    - Load user from JWT token on app initialization
    - Provide authentication state to all components
    - _Requirements: 3.2_

- [ ] 18. Frontend - Landing page
  - [x] 18.1 Create Landing page component
    - Build hero section with platform description
    - Add feature highlights (automated sync, multi-source aggregation, bookmarking)
    - Add CTA buttons (Explore Competitions, Sign Up)
    - Implement navigation to /explore and /register
    - Style with TailwindCSS
    - _Requirements: 9.1_

- [ ] 19. Frontend - Explore page
  - [x] 19.1 Create Explore page component
    - Build filter sidebar with controls for category, status, location, deadline, prize, difficulty, source
    - Build search bar for text queries
    - Build competition card grid
    - Build pagination controls
    - Implement filter state management
    - _Requirements: 9.2, 9.8_
  
  - [x] 19.2 Implement competition fetching and filtering
    - Call GET /api/competitions with query params on mount and filter changes
    - Update competition list without full page reload
    - Handle loading and error states
    - _Requirements: 8.3, 9.8_
  
  - [x] 19.3 Implement bookmark toggle on cards
    - Add bookmark button to each competition card
    - Call POST /api/bookmarks or DELETE /api/bookmarks/:id on click
    - Update UI to reflect bookmark state
    - Require authentication (redirect to login if not authenticated)
    - _Requirements: 9.7_

- [ ] 20. Frontend - Detail page
  - [x] 20.1 Create Detail page component
    - Extract competitionId from route params
    - Call GET /api/competitions/:id on mount
    - Display competition title, description, and metadata grid
    - Add bookmark button
    - Add external link button to competition.url
    - Style with TailwindCSS
    - Handle loading and error states (404)
    - _Requirements: 9.3_
  
  - [x] 20.2 Implement bookmark toggle on detail page
    - Call POST /api/bookmarks or DELETE /api/bookmarks/:id on bookmark button click
    - Update UI to reflect bookmark state
    - Require authentication
    - _Requirements: 9.7_

- [ ] 21. Frontend - Dashboard page
  - [x] 21.1 Create Dashboard page component
    - Require authentication (redirect to login if not authenticated)
    - Call GET /api/bookmarks on mount
    - Display bookmarked competitions list sorted by start_date
    - Highlight competitions with end_date within 7 days as "deadline approaching"
    - Display empty state message if no bookmarks
    - Add quick filter by status (upcoming, ongoing)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.4_
  
  - [x] 21.2 Implement remove bookmark functionality
    - Add remove button to each bookmarked competition
    - Call DELETE /api/bookmarks/:id on click
    - Update UI to remove competition from list
    - _Requirements: 4.2_

- [ ] 22. Frontend - Admin page
  - [x] 22.1 Create Admin page component
    - Require authentication and admin role (redirect to login or show 403 if not admin)
    - Build manual sync trigger button
    - Build sync logs table with columns: timestamp, source, status, record count, errors
    - Build platform statistics dashboard (user count, competition count, bookmark count)
    - Build competition management table with edit/delete actions
    - _Requirements: 7.1, 7.3, 7.4, 7.7, 9.5_
  
  - [x] 22.2 Implement manual sync trigger
    - Call POST /api/admin/sync on button click
    - Display loading state during sync
    - Refresh sync logs after sync completes
    - Display success/error messages
    - _Requirements: 7.3_
  
  - [x] 22.3 Implement sync logs fetching
    - Call GET /api/admin/sync-logs on mount
    - Display logs in table with pagination
    - _Requirements: 7.4_
  
  - [x] 22.4 Implement competition management
    - Call DELETE /api/admin/competitions/:id on delete action
    - Call PUT /api/admin/competitions/:id on edit action
    - Display confirmation dialog before delete
    - Refresh competition list after actions
    - _Requirements: 7.5, 7.6_

- [ ] 23. Frontend - Profile page
  - [x] 23.1 Create Profile page component
    - Require authentication
    - Display user information (username, email, role, created_at)
    - Display account statistics (total bookmarks, account age)
    - Build edit profile form (username, email)
    - Build change password form (old password, new password)
    - _Requirements: 9.6_
  
  - [x] 23.2 Implement profile update functionality
    - Call PUT /api/users/me on profile form submit
    - Display success/error messages
    - Update user context on success
    - _Requirements: 9.6_

- [x] 24. Checkpoint - Ensure frontend builds and all pages render
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 25. End-to-end tests
  - [x]* 25.1 Set up Playwright
    - Install Playwright
    - Configure test environment with test database
    - Create test fixtures for users and competitions
  
  - [x]* 25.2 Write E2E test for user registration and login
    - Navigate to landing page
    - Click "Sign Up" and fill registration form
    - Submit and verify redirect to dashboard
    - Logout and login with credentials
    - Verify dashboard loads
  
  - [x]* 25.3 Write E2E test for competition discovery
    - Navigate to Explore page
    - Apply category and status filters
    - Enter search query
    - Verify filtered results
    - Click competition card and verify detail page loads
  
  - [x]* 25.4 Write E2E test for bookmark management
    - Login as user
    - Navigate to competition detail
    - Click bookmark button
    - Navigate to dashboard
    - Verify competition appears in bookmarks
    - Click remove bookmark
    - Verify competition removed
  
  - [x]* 25.5 Write E2E test for admin workflow
    - Login as admin
    - Navigate to admin panel
    - Trigger manual sync
    - Verify sync logs update
    - Edit competition
    - Verify changes saved
    - Delete competition
    - Verify competition removed

- [x] 26. Deployment configuration
  - [x] 26.1 Create production environment configuration
    - Create production .env file template
    - Configure database connection pooling for production
    - Set up CORS for production frontend URL
    - Configure JWT token expiration for production
    - _Requirements: 11.7_
  
  - [x] 26.2 Create Docker configuration
    - Write Dockerfile for backend (Node.js)
    - Write Dockerfile for frontend (Nginx serving static build)
    - Write docker-compose.yml for local development (backend, frontend, PostgreSQL)
    - Write docker-compose.prod.yml for production deployment
  
  - [x] 26.3 Create deployment scripts
    - Write database migration script
    - Write seed script for initial admin user
    - Write health check endpoint (GET /api/health)
    - Write startup script that runs migrations before starting server

- [ ] 27. Final integration and testing
  - [ ] 27.1 Run full test suite
    - Run all unit tests (frontend and backend)
    - Run all property-based tests (100 iterations each)
    - Run all integration tests
    - Verify coverage meets thresholds (85% overall, 95% critical paths)
  
  - [ ] 27.2 Manual testing checklist
    - Verify all three external APIs successfully sync
    - Verify admin can manually trigger sync
    - Verify filters work in all combinations
    - Verify bookmarks persist across sessions
    - Verify JWT expiration handled gracefully
    - Verify mobile responsive design
    - Verify cross-browser compatibility (Chrome, Firefox, Safari)
    - Verify performance: page load < 2 seconds, filter response < 500ms
    - Verify accessibility: keyboard navigation and screen reader compatibility
  
  - [x] 27.3 Documentation
    - Write README.md with project overview, setup instructions, and API documentation
    - Write CONTRIBUTING.md with development guidelines
    - Write API.md with detailed endpoint documentation
    - Add inline code comments for complex logic

- [ ] 28. Final checkpoint - Ensure all tests pass and application is production-ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests verify multi-component interactions with real database
- E2E tests verify complete user workflows through browser
- The implementation follows a bottom-up approach to minimize dependencies and enable parallel work
- All code should follow the project's ESLint and Prettier configurations
- All API endpoints should include proper error handling and validation
- All frontend components should handle loading and error states gracefully
