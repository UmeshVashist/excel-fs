-- ============================================================
-- 007. ADD SOFT DELETE COLUMNS FOR RECYCLE BIN (ROBUST VERSION)
-- ============================================================

-- 1. Add soft delete columns to all relevant tables
DO $$ 
BEGIN
    -- Formulas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formulas' AND column_name='is_deleted') THEN
        ALTER TABLE public.formulas ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formulas' AND column_name='deleted_at') THEN
        ALTER TABLE public.formulas ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='is_deleted') THEN
        ALTER TABLE public.notes ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='deleted_at') THEN
        ALTER TABLE public.notes ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- URLs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='urls' AND column_name='is_deleted') THEN
        ALTER TABLE public.urls ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='urls' AND column_name='deleted_at') THEN
        ALTER TABLE public.urls ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Todos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='is_deleted') THEN
        ALTER TABLE public.todos ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='deleted_at') THEN
        ALTER TABLE public.todos ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Shortcuts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shortcuts' AND column_name='is_deleted') THEN
        ALTER TABLE public.shortcuts ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shortcuts' AND column_name='deleted_at') THEN
        ALTER TABLE public.shortcuts ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_formulas_is_deleted ON public.formulas(is_deleted);
CREATE INDEX IF NOT EXISTS idx_notes_is_deleted ON public.notes(is_deleted);
CREATE INDEX IF NOT EXISTS idx_urls_is_deleted ON public.urls(is_deleted);
CREATE INDEX IF NOT EXISTS idx_todos_is_deleted ON public.todos(is_deleted);
CREATE INDEX IF NOT EXISTS idx_shortcuts_is_deleted ON public.shortcuts(is_deleted);

-- 3. Update RLS Policies to handle is_deleted flag

-- FORMULAS
DROP POLICY IF EXISTS "Users can view their own formulas" ON public.formulas;
CREATE POLICY "Users can view their own formulas" ON public.formulas
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = FALSE);

CREATE POLICY "Users can view their own deleted formulas" ON public.formulas
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = TRUE);

DROP POLICY IF EXISTS "Users can update their own formulas" ON public.formulas;
CREATE POLICY "Users can update their own formulas" ON public.formulas
  FOR UPDATE USING (auth.uid() = user_id);

-- NOTES
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = FALSE);

CREATE POLICY "Users can view their own deleted notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = TRUE);

DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

-- URLS
DROP POLICY IF EXISTS "Users can view their own urls" ON public.urls;
CREATE POLICY "Users can view their own urls" ON public.urls
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = FALSE);

CREATE POLICY "Users can view their own deleted urls" ON public.urls
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = TRUE);

DROP POLICY IF EXISTS "Users can update their own urls" ON public.urls;
CREATE POLICY "Users can update their own urls" ON public.urls
  FOR UPDATE USING (auth.uid() = user_id);

-- TODOS
DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos;
CREATE POLICY "Users can view their own todos" ON public.todos
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = FALSE);

CREATE POLICY "Users can view their own deleted todos" ON public.todos
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = TRUE);

DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
CREATE POLICY "Users can update their own todos" ON public.todos
  FOR UPDATE USING (auth.uid() = user_id);

-- SHORTCUTS
DROP POLICY IF EXISTS "Users can view their own shortcuts" ON public.shortcuts;
CREATE POLICY "Users can view their own shortcuts" ON public.shortcuts
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = FALSE);

CREATE POLICY "Users can view their own deleted shortcuts" ON public.shortcuts
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = TRUE);

DROP POLICY IF EXISTS "Users can update their own shortcuts" ON public.shortcuts;
CREATE POLICY "Users can update their own shortcuts" ON public.shortcuts
  FOR UPDATE USING (auth.uid() = user_id);
