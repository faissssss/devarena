ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE TABLE IF NOT EXISTS user_oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_oauth_provider CHECK (provider IN ('google', 'github')),
  CONSTRAINT unique_provider_account UNIQUE (provider, provider_user_id),
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_oauth_accounts_user_id
ON user_oauth_accounts(user_id);

COMMENT ON TABLE user_oauth_accounts IS 'OAuth provider identities linked to DevArena users';
COMMENT ON COLUMN users.avatar_url IS 'Optional profile image URL from an OAuth provider';
