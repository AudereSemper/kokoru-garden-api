-- Care preferences table - User settings from onboarding step 3
CREATE TABLE care_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Care tracking preferences (from onboarding)
  care_tracking_enabled BOOLEAN DEFAULT false,
  watering_schedule_enabled BOOLEAN DEFAULT false,
  repotting_reminders_enabled BOOLEAN DEFAULT false,
  seasonal_treatments_enabled BOOLEAN DEFAULT false,
  custom_tasks_enabled BOOLEAN DEFAULT false,
  
  -- Public portfolio preferences  
  public_profile_enabled BOOLEAN DEFAULT false,
  profile_username TEXT UNIQUE, -- For kokoru.garden/username URL
  
  -- Onboarding completion tracking
  onboarding_completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One preference set per user
  CONSTRAINT one_preference_per_user UNIQUE(user_id)
);

-- Index for public profile URL lookups
CREATE INDEX idx_care_preferences_username 
  ON care_preferences(profile_username) 
  WHERE profile_username IS NOT NULL;

-- Enable RLS
ALTER TABLE care_preferences ENABLE ROW LEVEL SECURITY;