-- Species table - Pre-populated common species + user custom entries
CREATE TABLE species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Species data
  name TEXT NOT NULL,
  latin_name TEXT,
  
  -- Track if system-provided or user-created
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL for system species
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate custom species per user
  CONSTRAINT unique_species_per_user 
    UNIQUE(name, created_by)
);

-- Indexes for autocomplete and lookups
CREATE INDEX idx_species_name ON species(name);
CREATE INDEX idx_species_created_by ON species(created_by) WHERE created_by IS NOT NULL;

-- Enable RLS
ALTER TABLE species ENABLE ROW LEVEL SECURITY;

-- Insert some common species (system-provided)
INSERT INTO species (name, latin_name, is_custom, created_by) VALUES
  ('Ficus', 'Ficus retusa', false, NULL),
  ('Juniper', 'Juniperus', false, NULL),
  ('Maple', 'Acer', false, NULL),
  ('Pine', 'Pinus', false, NULL),
  ('Chinese Elm', 'Ulmus parvifolia', false, NULL),
  ('Olive', 'Olea europaea', false, NULL),
  ('Azalea', 'Rhododendron', false, NULL),
  ('Boxwood', 'Buxus', false, NULL);