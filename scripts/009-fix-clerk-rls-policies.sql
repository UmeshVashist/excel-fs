-- Fix Supabase RLS Policies for Clerk Authentication
-- Run this in your Supabase SQL Editor if data is blocked by RLS policies.

-- Disable RLS on core tables (since Auth is now handled by Clerk middleware)
ALTER TABLE IF EXISTS public.formulas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shortcuts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.urls DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shared_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.item_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.layout_history DISABLE ROW LEVEL SECURITY;

-- Ensure clerk_user_id column exists on all relevant tables
ALTER TABLE IF EXISTS public.formulas ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE IF EXISTS public.shortcuts ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE IF EXISTS public.notes ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE IF EXISTS public.urls ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE IF EXISTS public.todos ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_formulas_clerk_user_id ON public.formulas(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_clerk_user_id ON public.shortcuts(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_notes_clerk_user_id ON public.notes(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_urls_clerk_user_id ON public.urls(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_todos_clerk_user_id ON public.todos(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON public.profiles(clerk_user_id);
