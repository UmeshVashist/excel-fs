-- Create fingerprint_data table to store enrolled fingerprint templates
CREATE TABLE IF NOT EXISTS public.fingerprint_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  finger_position VARCHAR(20) NOT NULL,
  template_data TEXT NOT NULL,
  quality_score INTEGER NOT NULL,
  device_type VARCHAR(50) DEFAULT 'MFS110',
  is_active BOOLEAN DEFAULT true,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, finger_position)
);

-- Create fingerprint_auth_logs table to track authentication attempts
CREATE TABLE IF NOT EXISTS public.fingerprint_auth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  finger_position VARCHAR(20) NOT NULL,
  match_score INTEGER NOT NULL,
  is_successful BOOLEAN NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add fingerprint columns to profiles table if they don't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fingerprint_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fingerprint_enrolled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_fingerprint_auth TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fingerprint_data_user_id ON public.fingerprint_data(user_id);
CREATE INDEX IF NOT EXISTS idx_fingerprint_data_is_active ON public.fingerprint_data(is_active);
CREATE INDEX IF NOT EXISTS idx_fingerprint_auth_logs_user_id ON public.fingerprint_auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fingerprint_auth_logs_created_at ON public.fingerprint_auth_logs(created_at);

-- Enable RLS on fingerprint_data table
ALTER TABLE public.fingerprint_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - Users can only view their own fingerprints
CREATE POLICY "Users can view their own fingerprints"
  ON public.fingerprint_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy - Users can insert their own fingerprints
CREATE POLICY "Users can insert their own fingerprints"
  ON public.fingerprint_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy - Users can update their own fingerprints
CREATE POLICY "Users can update their own fingerprints"
  ON public.fingerprint_data
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policy - Users can delete their own fingerprints
CREATE POLICY "Users can delete their own fingerprints"
  ON public.fingerprint_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on fingerprint_auth_logs table
ALTER TABLE public.fingerprint_auth_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - Users can only view their own auth logs
CREATE POLICY "Users can view their own auth logs"
  ON public.fingerprint_auth_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy - Service role can insert auth logs
CREATE POLICY "Service role can insert auth logs"
  ON public.fingerprint_auth_logs
  FOR INSERT
  WITH CHECK (true);
