-- Folders table - Organization for trees (max 2 levels)
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  
  -- Folder structure
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level IN (1, 2)),
  position INTEGER DEFAULT 0, -- For custom ordering
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate names at same level for same user
  CONSTRAINT unique_folder_name_per_level 
    UNIQUE (user_id, parent_id, name)
);

-- Indexes for common queries
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;