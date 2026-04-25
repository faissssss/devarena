# Requirements Document

## Introduction

DevArena is a full-stack web application that aggregates real-time developer competitions, hackathons, coding contests, and AI/data science challenges from multiple sources into a single searchable hub. The platform provides automated data synchronization, user authentication, personalized bookmarking, and comprehensive filtering capabilities to help developers discover and track competitions across various platforms.

## Glossary

- **DevArena_System**: The complete full-stack web application including frontend, backend, database, and scheduler components
- **Competition**: An event entry representing a hackathon, coding contest, AI challenge, or CTF competition
- **User**: An authenticated individual with role-based access (user or admin)
- **Bookmark**: A saved reference linking a User to a Competition for tracking purposes
- **Data_Sync_Service**: The automated scheduler component that fetches competition data from external APIs
- **Authentication_Service**: The JWT-based authentication and authorization system
- **Competition_Aggregator**: The backend service that processes and stores competition data from multiple sources
- **Filter_Engine**: The search and filtering system for competitions
- **Admin_Panel**: The administrative interface for manual sync triggers and competition management
- **API_Source**: External data provider (Kontests.net, CLIST.by, or Kaggle API)
- **Sync_Log**: A record of data synchronization attempts and results
- **JWT_Token**: JSON Web Token used for user session management
- **Category**: Competition classification (Competitive Programming, Hackathons, AI/Data Science, CTF/Security)

## Requirements

### Requirement 1: Automated Competition Data Synchronization

**User Story:** As a platform operator, I want automated data synchronization from external APIs, so that competition data remains current without manual intervention.

#### Acceptance Criteria

1. THE Data_Sync_Service SHALL execute synchronization jobs every 6 hours using node-cron
2. WHEN a synchronization job executes, THE Data_Sync_Service SHALL fetch competition data from Kontests.net API
3. WHEN a synchronization job executes, THE Data_Sync_Service SHALL fetch competition data from CLIST.by API
4. WHEN a synchronization job executes, THE Data_Sync_Service SHALL fetch competition data from Kaggle API
5. WHEN data is fetched from an API_Source, THE Competition_Aggregator SHALL parse the response into the unified Competition schema
6. WHEN parsing completes, THE Competition_Aggregator SHALL store Competition records in the PostgreSQL database
7. WHEN a synchronization job completes, THE Data_Sync_Service SHALL create a Sync_Log entry with timestamp, source, status, and record count
8. IF an API_Source request fails, THEN THE Data_Sync_Service SHALL log the error and continue with remaining sources
9. WHEN duplicate competitions are detected, THE Competition_Aggregator SHALL update existing records rather than create duplicates

### Requirement 2: Competition Data Management

**User Story:** As a developer, I want to view aggregated competitions from multiple platforms, so that I can discover opportunities in one place.

#### Acceptance Criteria

1. THE DevArena_System SHALL store Competition records with fields: id, title, description, category, platform, url, start_date, end_date, status, location, prize, difficulty, source
2. THE DevArena_System SHALL classify competitions into exactly one Category: Competitive Programming, Hackathons, AI/Data Science, or CTF/Security
3. WHEN a Competition start_date is in the future, THE DevArena_System SHALL set status to "upcoming"
4. WHEN a Competition start_date has passed and end_date is in the future, THE DevArena_System SHALL set status to "ongoing"
5. WHEN a Competition end_date has passed, THE DevArena_System SHALL set status to "ended"
6. THE DevArena_System SHALL support competitions from at least 10 distinct platforms
7. THE Competition_Aggregator SHALL preserve the original source URL for each Competition

### Requirement 3: User Authentication and Authorization

**User Story:** As a user, I want secure authentication, so that I can access personalized features and protect my data.

#### Acceptance Criteria

1. WHEN a user submits registration credentials, THE Authentication_Service SHALL hash the password using bcrypt
2. WHEN a user submits valid login credentials, THE Authentication_Service SHALL generate a JWT_Token with user id and role
3. THE Authentication_Service SHALL support two roles: "user" and "admin"
4. WHEN a JWT_Token is presented, THE Authentication_Service SHALL validate the token signature and expiration
5. WHEN a JWT_Token is invalid or expired, THE Authentication_Service SHALL return an authentication error
6. THE DevArena_System SHALL store User records with fields: id, username, email, password_hash, role, created_at
7. WHEN a user registers, THE Authentication_Service SHALL assign the "user" role by default
8. THE Authentication_Service SHALL enforce unique constraints on username and email fields

### Requirement 4: Bookmark Management

**User Story:** As a user, I want to bookmark competitions, so that I can track events I'm interested in.

#### Acceptance Criteria

1. WHEN an authenticated User requests to bookmark a Competition, THE DevArena_System SHALL create a Bookmark record linking the User and Competition
2. WHEN an authenticated User requests to remove a bookmark, THE DevArena_System SHALL delete the corresponding Bookmark record
3. WHEN an authenticated User views their bookmarks, THE DevArena_System SHALL return all Competitions associated with their Bookmark records
4. THE DevArena_System SHALL store Bookmark records with fields: id, user_id, competition_id, created_at
5. THE DevArena_System SHALL prevent duplicate bookmarks for the same User and Competition combination
6. WHEN a User is deleted, THE DevArena_System SHALL cascade delete all associated Bookmark records
7. WHEN a Competition is deleted, THE DevArena_System SHALL cascade delete all associated Bookmark records

### Requirement 5: Competition Search and Filtering

**User Story:** As a developer, I want to filter competitions by multiple criteria, so that I can find relevant opportunities quickly.

#### Acceptance Criteria

1. WHEN a user applies a category filter, THE Filter_Engine SHALL return only Competitions matching the selected Category
2. WHEN a user applies a status filter, THE Filter_Engine SHALL return only Competitions matching the selected status (upcoming, ongoing, ended)
3. WHEN a user applies a location filter, THE Filter_Engine SHALL return only Competitions matching the specified location or "online"
4. WHEN a user applies a deadline filter, THE Filter_Engine SHALL return only Competitions with end_date within the specified time range
5. WHEN a user applies a prize filter, THE Filter_Engine SHALL return only Competitions with prize values meeting the specified criteria
6. WHEN a user applies a difficulty filter, THE Filter_Engine SHALL return only Competitions matching the selected difficulty level
7. WHEN a user applies a source filter, THE Filter_Engine SHALL return only Competitions from the selected API_Source
8. WHEN a user applies multiple filters simultaneously, THE Filter_Engine SHALL return Competitions matching all filter criteria (AND logic)
9. WHEN a user submits a search query, THE Filter_Engine SHALL return Competitions with title or description containing the query text
10. THE Filter_Engine SHALL support case-insensitive text search

### Requirement 6: User Dashboard

**User Story:** As a user, I want a personalized dashboard, so that I can view my bookmarked competitions and track deadlines.

#### Acceptance Criteria

1. WHEN an authenticated User accesses the dashboard, THE DevArena_System SHALL display all Competitions associated with their Bookmark records
2. WHEN displaying bookmarked Competitions, THE DevArena_System SHALL show title, category, status, start_date, end_date, and platform
3. WHEN a bookmarked Competition has an end_date within 7 days, THE DevArena_System SHALL highlight it as "deadline approaching"
4. THE DevArena_System SHALL sort bookmarked Competitions by start_date in ascending order
5. WHEN a User has no bookmarks, THE DevArena_System SHALL display a message prompting them to explore competitions

### Requirement 7: Administrative Controls

**User Story:** As an admin, I want to manually trigger data synchronization and manage competitions, so that I can maintain data quality and handle edge cases.

#### Acceptance Criteria

1. WHEN a User with "admin" role accesses the Admin_Panel, THE DevArena_System SHALL grant access
2. WHEN a User without "admin" role attempts to access the Admin_Panel, THE DevArena_System SHALL deny access and return an authorization error
3. WHEN an admin triggers a manual sync, THE Data_Sync_Service SHALL execute an immediate synchronization job
4. WHEN an admin views sync logs, THE DevArena_System SHALL display all Sync_Log entries with timestamp, source, status, and record count
5. WHEN an admin requests to delete a Competition, THE DevArena_System SHALL remove the Competition record and all associated Bookmark records
6. WHEN an admin requests to update a Competition, THE DevArena_System SHALL modify the specified fields and preserve the original source
7. THE Admin_Panel SHALL display total counts of Users, Competitions, and Bookmarks

### Requirement 8: REST API Endpoints

**User Story:** As a frontend developer, I want well-defined REST API endpoints, so that I can build a responsive user interface.

#### Acceptance Criteria

1. THE DevArena_System SHALL expose a POST /api/auth/register endpoint that accepts username, email, and password
2. THE DevArena_System SHALL expose a POST /api/auth/login endpoint that returns a JWT_Token upon successful authentication
3. THE DevArena_System SHALL expose a GET /api/competitions endpoint that returns paginated Competition records
4. THE DevArena_System SHALL expose a GET /api/competitions/:id endpoint that returns a single Competition by id
5. THE DevArena_System SHALL expose a POST /api/bookmarks endpoint that creates a Bookmark for an authenticated User
6. THE DevArena_System SHALL expose a DELETE /api/bookmarks/:id endpoint that removes a Bookmark for an authenticated User
7. THE DevArena_System SHALL expose a GET /api/bookmarks endpoint that returns all Bookmarks for an authenticated User
8. THE DevArena_System SHALL expose a POST /api/admin/sync endpoint that triggers manual synchronization (admin only)
9. THE DevArena_System SHALL expose a GET /api/admin/sync-logs endpoint that returns Sync_Log entries (admin only)
10. THE DevArena_System SHALL expose a DELETE /api/admin/competitions/:id endpoint that deletes a Competition (admin only)
11. THE DevArena_System SHALL expose a PUT /api/admin/competitions/:id endpoint that updates a Competition (admin only)
12. WHEN an API endpoint requires authentication, THE DevArena_System SHALL validate the JWT_Token in the Authorization header
13. WHEN an API endpoint receives invalid input, THE DevArena_System SHALL return a 400 status code with error details
14. WHEN an API endpoint encounters a server error, THE DevArena_System SHALL return a 500 status code with error message

### Requirement 9: Frontend User Interface

**User Story:** As a developer, I want an intuitive web interface, so that I can easily navigate and interact with the platform.

#### Acceptance Criteria

1. THE DevArena_System SHALL provide a Landing page with platform overview and call-to-action buttons
2. THE DevArena_System SHALL provide an Explore page displaying all Competitions with filter controls
3. THE DevArena_System SHALL provide a Detail page showing complete information for a single Competition
4. THE DevArena_System SHALL provide a Dashboard page displaying bookmarked Competitions for authenticated Users
5. THE DevArena_System SHALL provide an Admin page with sync controls and competition management (admin only)
6. THE DevArena_System SHALL provide a Profile page displaying User information and account settings
7. WHEN a User clicks a bookmark button on a Competition, THE DevArena_System SHALL toggle the bookmark state
8. WHEN a User applies filters on the Explore page, THE DevArena_System SHALL update the Competition list without full page reload
9. THE DevArena_System SHALL use React with Vite for frontend framework
10. THE DevArena_System SHALL use TailwindCSS for styling

### Requirement 10: Database Schema and Integrity

**User Story:** As a system architect, I want a well-structured database schema, so that data integrity is maintained and queries are efficient.

#### Acceptance Criteria

1. THE DevArena_System SHALL use PostgreSQL as the database management system
2. THE DevArena_System SHALL define a users table with columns: id (primary key), username (unique), email (unique), password_hash, role, created_at
3. THE DevArena_System SHALL define a competitions table with columns: id (primary key), title, description, category, platform, url, start_date, end_date, status, location, prize, difficulty, source, created_at, updated_at
4. THE DevArena_System SHALL define a bookmarks table with columns: id (primary key), user_id (foreign key), competition_id (foreign key), created_at
5. THE DevArena_System SHALL define a sync_logs table with columns: id (primary key), source, status, record_count, error_message, synced_at
6. THE DevArena_System SHALL enforce foreign key constraints on bookmarks.user_id referencing users.id
7. THE DevArena_System SHALL enforce foreign key constraints on bookmarks.competition_id referencing competitions.id
8. THE DevArena_System SHALL create an index on competitions.category for efficient filtering
9. THE DevArena_System SHALL create an index on competitions.status for efficient filtering
10. THE DevArena_System SHALL create an index on competitions.start_date for efficient sorting and deadline queries

### Requirement 11: Configuration Parser and Environment Management

**User Story:** As a developer, I want to parse configuration files, so that I can manage environment-specific settings for database, API keys, and JWT secrets.

#### Acceptance Criteria

1. WHEN the DevArena_System starts, THE Configuration_Parser SHALL parse the .env configuration file
2. WHEN a valid .env file is provided, THE Configuration_Parser SHALL load environment variables into the application context
3. WHEN an invalid or missing .env file is encountered, THE Configuration_Parser SHALL return a descriptive error message
4. THE Configuration_Parser SHALL validate required environment variables: DATABASE_URL, JWT_SECRET, PORT, KONTESTS_API_URL, CLIST_API_URL, KAGGLE_API_KEY
5. THE Configuration_Formatter SHALL format configuration objects back into valid .env file format
6. FOR ALL valid configuration objects, parsing then formatting then parsing SHALL produce an equivalent configuration object (round-trip property)
7. THE DevArena_System SHALL use parsed configuration values for database connection, JWT signing, API endpoints, and server port

### Requirement 12: API Response Parser

**User Story:** As a backend developer, I want to parse API responses from external sources, so that I can transform heterogeneous data into a unified Competition schema.

#### Acceptance Criteria

1. WHEN the Data_Sync_Service receives a response from Kontests.net API, THE API_Response_Parser SHALL parse the JSON response into Competition objects
2. WHEN the Data_Sync_Service receives a response from CLIST.by API, THE API_Response_Parser SHALL parse the JSON response into Competition objects
3. WHEN the Data_Sync_Service receives a response from Kaggle API, THE API_Response_Parser SHALL parse the JSON response into Competition objects
4. WHEN an API response contains invalid JSON, THE API_Response_Parser SHALL return a descriptive error message
5. WHEN an API response is missing required fields, THE API_Response_Parser SHALL use default values or skip the record with a warning
6. THE API_Response_Parser SHALL map source-specific field names to the unified Competition schema
7. THE API_Response_Parser SHALL normalize date formats from different sources into ISO 8601 format
8. FOR ALL valid Competition objects, serializing to JSON then parsing SHALL produce an equivalent Competition object (round-trip property)
