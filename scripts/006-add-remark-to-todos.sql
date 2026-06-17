-- Add remark column to todos table
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS remark TEXT;
