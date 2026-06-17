-- Create fingerprint_data table to store fingerprint templates
CREATE TABLE IF NOT EXISTS fingerprint_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  finger_position TEXT NOT NULL CHECK (finger_position IN ('thumb_right', 'index_right', 'middle_right', 'ring_right', 'pinky_right', 'thumb_left', 'index_left', 'middle_left', 'ring_left', 'pinky_left')),
  template_data TEXT NOT NULL, -- Base64 encoded fingerprint template from Mantra device
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  device_type TEXT NOT NULL, -- MFS100 or MFS110
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, finger_position)
);

-- Add fingerprint columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fingerprint_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fingerprint_enrolled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_fingerprint_auth TIMESTAMP WITH TIME ZONE;

-- Create fingerprint_auth_logs table for security auditing
CREATE TABLE IF NOT EXISTS fingerprint_auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  match_score INTEGER,
  device_type TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fingerprint_data_user_id ON fingerprint_data(user_id);
CREATE INDEX IF NOT EXISTS idx_fingerprint_data_active ON fingerprint_data(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_fingerprint_auth_logs_user_id ON fingerprint_auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fingerprint_auth_logs_created_at ON fingerprint_auth_logs(created_at);

-- Enable Row Level Security
ALTER TABLE fingerprint_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fingerprint_auth_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fingerprint_data
CREATE POLICY "Users can view their own fingerprint data"
  ON fingerprint_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fingerprint data"
  ON fingerprint_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fingerprint data"
  ON fingerprint_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fingerprint data"
  ON fingerprint_data FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for fingerprint_auth_logs
CREATE POLICY "Users can view their own auth logs"
  ON fingerprint_auth_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert auth logs"
  ON fingerprint_auth_logs FOR INSERT
  WITH CHECK (true);
