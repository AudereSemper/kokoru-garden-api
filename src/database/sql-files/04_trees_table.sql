-- Trees table - Core entity for bonsai
CREATE TABLE trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  
  -- Identity fields from onboarding
  nickname TEXT,
  species_id UUID NOT NULL REFERENCES species(id),
  acquired_date DATE NOT NULL,
  
  -- Acquisition details
  acquisition_source TEXT CHECK (acquisition_source IN 
    ('nursery', 'private_seller', 'gift', 'grown_from_seed')),
  source_name TEXT, -- Nursery name or seller name
  purchase_price DECIMAL(10,2), -- Always private, never shown publicly
  
  -- Privacy & display settings
  is_public BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0, -- Order within folder
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_trees_user_id ON trees(user_id);
CREATE INDEX idx_trees_folder_id ON trees(folder_id);
CREATE INDEX idx_trees_species_id ON trees(species_id);
CREATE INDEX idx_trees_public ON trees(is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;