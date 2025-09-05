-- Photos table - Timeline/progression tracking
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Denormalized for RLS
  
  -- Photo data
  photo_url TEXT NOT NULL, -- URL from storage service
  thumbnail_url TEXT, -- Optional optimized thumbnail
  caption TEXT,
  
  -- Temporal data (critical for timeline)
  taken_at DATE NOT NULL, -- When photo was actually taken
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for timeline queries
CREATE INDEX idx_photos_tree_id ON photos(tree_id);
CREATE INDEX idx_photos_taken_at ON photos(tree_id, taken_at DESC); -- Timeline ordering
CREATE INDEX idx_photos_user_id ON photos(user_id);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;