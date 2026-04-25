-- Migration: Create users table
-- Description: User authentication and authorization table with role-based access control
-- Requirements: 10.1, 10.2, 10.6

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin')),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_username CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50)
);

-- Index for efficient email lookups during authentication
CREATE INDEX idx_users_email ON users(email);

-- Index for username lookups
CREATE INDEX idx_users_username ON users(username);

COMMENT ON TABLE users IS 'User accounts with authentication credentials and role-based access control';
COMMENT ON COLUMN users.id IS 'Unique identifier (UUID v4)';
COMMENT ON COLUMN users.username IS 'Display name (3-50 characters)';
COMMENT ON COLUMN users.email IS 'Login credential (must be valid email format)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash (60 characters)';
COMMENT ON COLUMN users.role IS 'Access level (user or admin)';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';
