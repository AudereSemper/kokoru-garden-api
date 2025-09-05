-- Users table - Authentication and security
-- This table handles auth only, bonsai-specific data goes in profiles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core authentication
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255), -- Nullable for OAuth users
  
  -- User identity (basic)
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  
  -- Security & login tracking
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  last_login_ip VARCHAR(45), -- Supports IPv6
  
  -- OAuth
  google_id VARCHAR(255) UNIQUE,
  auth_provider VARCHAR(20) DEFAULT 'local' CHECK (auth_provider IN ('local', 'google')),
  
  -- Tokens
  refresh_token TEXT,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMPTZ,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMPTZ,
  
  -- Password tracking
  password_changed_at TIMESTAMPTZ,
  
  -- Login history
  has_logged_in BOOLEAN DEFAULT false,
  
  -- Email service tracking
  last_verification_email_sent_at TIMESTAMPTZ,
  last_password_reset_request_at TIMESTAMPTZ,
  
  -- Onboarding tracking (stays in users as part of registration flow)
  has_completed_onboarding BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0 CHECK (onboarding_step >= 0 AND onboarding_step <= 4),
  
  -- Onboarding Step 1: First photo
  onboarding_first_photo_url TEXT,
  onboarding_photo_taken_at DATE,
  
  -- Onboarding Step 2: Tree identity
  onboarding_tree_nickname TEXT,
  onboarding_tree_species TEXT, -- Temporary, will create proper species record
  onboarding_tree_acquired_date DATE,
  onboarding_tree_acquisition_source TEXT CHECK (
    onboarding_tree_acquisition_source IS NULL OR
    onboarding_tree_acquisition_source IN ('nursery', 'private_seller', 'gift', 'grown_from_seed')
  ),
  onboarding_tree_source_name TEXT,
  onboarding_tree_purchase_price DECIMAL(10,2),
  
  -- Onboarding Step 3: Features selection (stored in care_preferences after completion)
  -- These are temporary until onboarding completes
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for authentication queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;

-- Enable RLS (even though this might be accessed differently than other tables)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can only view their own record
CREATE POLICY "Users can view own user record" 
  ON users FOR SELECT 
  USING (id = auth.uid());

-- Users can update their own record (but not all fields)
CREATE POLICY "Users can update own user record" 
  ON users FOR UPDATE 
  USING (id = auth.uid());

-- Note: INSERT typically happens through your auth service, not directly
-- You might want to use a service role key for user creation