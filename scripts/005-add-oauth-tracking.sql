-- ============================================================
-- OAuth Account Setup Migration (Robust Version)
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to add OAuth tracking
-- and fix the "Database error saving new user" issue.
-- ============================================================

-- 1. Ensure all required columns exist in profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'oauth_provider') THEN
        ALTER TABLE public.profiles ADD COLUMN oauth_provider TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'password_set') THEN
        ALTER TABLE public.profiles ADD COLUMN password_set BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'oauth_signup_date') THEN
        ALTER TABLE public.profiles ADD COLUMN oauth_signup_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Update the handle_new_user() function to be extremely robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  oauth_provider_name TEXT;
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Determine if this is an OAuth signup by checking provider
  oauth_provider_name := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    NULL
  );

  -- Generate a base username
  base_username := LOWER(COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1),
    'user'
  ));
  
  -- Ensure username is not empty
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  -- Handle username collisions (important to prevent "Database error saving new user")
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username AND id != NEW.id) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;

  -- Insert or Update the profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    oauth_provider,
    password_set,
    oauth_signup_date,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    final_username,
    oauth_provider_name,
    -- password_set is true only for non-OAuth users (who sign up with password)
    (oauth_provider_name IS NULL),
    CASE WHEN oauth_provider_name IS NOT NULL THEN CURRENT_TIMESTAMP ELSE NULL END,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    oauth_provider = COALESCE(EXCLUDED.oauth_provider, profiles.oauth_provider),
    updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: If everything fails, try to at least create a basic profile with ID
  -- This prevents the entire signup from failing
  INSERT INTO public.profiles (id, email, username, updated_at)
  VALUES (NEW.id, NEW.email, 'user_' || substr(NEW.id::text, 1, 8), CURRENT_TIMESTAMP)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the trigger to ensure it's pointing to the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Add index for faster queries on oauth_provider
CREATE INDEX IF NOT EXISTS idx_profiles_oauth_provider ON public.profiles(oauth_provider);

