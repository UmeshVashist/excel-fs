-- ============================================================
-- 1. SHARED ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shared_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('formulas', 'notes', 'shortcuts', 'urls', 'todos')),
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(shared_with_id, resource_id, resource_type)
);

ALTER TABLE public.shared_items ENABLE ROW LEVEL SECURITY;

-- Policies for shared_items
CREATE POLICY "Users can view shares they own or are shared with them" ON public.shared_items
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);

CREATE POLICY "Users can create shares for items they own" ON public.shared_items
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete shares they own" ON public.shared_items
  FOR DELETE USING (auth.uid() = owner_id);

-- ============================================================
-- 2. ITEM HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.item_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.item_history ENABLE ROW LEVEL SECURITY;

-- Policies for item_history
CREATE POLICY "Users can view history of items they own or have access to" ON public.item_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.formulas f WHERE f.id = resource_id AND (f.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shared_items s WHERE s.resource_id = f.id AND s.shared_with_id = auth.uid()))
    ) OR
    EXISTS (
      SELECT 1 FROM public.notes n WHERE n.id = resource_id AND (n.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shared_items s WHERE s.resource_id = n.id AND s.shared_with_id = auth.uid()))
    ) OR
    EXISTS (
      SELECT 1 FROM public.shortcuts sh WHERE sh.id = resource_id AND (sh.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shared_items s WHERE s.resource_id = sh.id AND s.shared_with_id = auth.uid()))
    ) OR
    EXISTS (
      SELECT 1 FROM public.urls u WHERE u.id = resource_id AND (u.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shared_items s WHERE s.resource_id = u.id AND s.shared_with_id = auth.uid()))
    ) OR
    EXISTS (
      SELECT 1 FROM public.todos t WHERE t.id = resource_id AND (t.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shared_items s WHERE s.resource_id = t.id AND s.shared_with_id = auth.uid()))
    )
  );

-- ============================================================
-- 3. UPDATE RLS POLICIES FOR EXISTING TABLES
-- ============================================================

-- FORMULAS
DROP POLICY IF EXISTS "Users can view shared formulas" ON public.formulas;
CREATE POLICY "Users can view shared formulas" ON public.formulas
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.shared_items 
      WHERE resource_id = public.formulas.id 
      AND shared_with_id = auth.uid()
      AND resource_type = 'formulas'
    )
  );

DROP POLICY IF EXISTS "Users can update shared formulas" ON public.formulas;
CREATE POLICY "Users can update shared formulas" ON public.formulas
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.shared_items 
      WHERE resource_id = public.formulas.id 
      AND shared_with_id = auth.uid() 
      AND permission = 'edit'
      AND resource_type = 'formulas'
    )
  );

-- NOTES
DROP POLICY IF EXISTS "Users can view shared notes" ON public.notes;
CREATE POLICY "Users can view shared notes" ON public.notes
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.shared_items 
      WHERE resource_id = public.notes.id 
      AND shared_with_id = auth.uid()
      AND resource_type = 'notes'
    )
  );

DROP POLICY IF EXISTS "Users can update shared notes" ON public.notes;
CREATE POLICY "Users can update shared notes" ON public.notes
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.shared_items 
      WHERE resource_id = public.notes.id 
      AND shared_with_id = auth.uid() 
      AND permission = 'edit'
      AND resource_type = 'notes'
    )
  );

-- SHORTCUTS
DROP POLICY IF EXISTS "Users can view shared shortcuts" ON public.shortcuts;
CREATE POLICY "Users can view shared shortcuts" ON public.shortcuts
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.shared_items 
      WHERE resource_id = public.shortcuts.id 
      AND shared_with_id = auth.uid()
      AND resource_type = 'shortcuts'
    )
  );

DROP POLICY IF EXISTS "Users can update shared shortcuts" ON public.shortcuts;
CREATE POLICY "Users can update shared shortcuts" ON public.shortcuts
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.shared_items 
      WHERE resource_id = public.shortcuts.id 
      AND shared_with_id = auth.uid() 
      AND permission = 'edit'
      AND resource_type = 'shortcuts'
    )
  );

-- URLS
DROP POLICY IF EXISTS "Users can view shared urls" ON public.urls;
CREATE POLICY "Users can view shared urls" ON public.urls
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.shared_items 
      WHERE resource_id = public.urls.id 
      AND shared_with_id = auth.uid()
      AND resource_type = 'urls'
    )
  );

DROP POLICY IF EXISTS "Users can update shared urls" ON public.urls;
CREATE POLICY "Users can update shared urls" ON public.urls
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.shared_items 
      WHERE resource_id = public.urls.id 
      AND shared_with_id = auth.uid() 
      AND permission = 'edit'
      AND resource_type = 'urls'
    )
  );

-- TODOS
DROP POLICY IF EXISTS "Users can view shared todos" ON public.todos;
CREATE POLICY "Users can view shared todos" ON public.todos
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.shared_items 
      WHERE resource_id = public.todos.id 
      AND shared_with_id = auth.uid()
      AND resource_type = 'todos'
    )
  );

DROP POLICY IF EXISTS "Users can update shared todos" ON public.todos;
CREATE POLICY "Users can update shared todos" ON public.todos
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.shared_items 
      WHERE resource_id = public.todos.id 
      AND shared_with_id = auth.uid() 
      AND permission = 'edit'
      AND resource_type = 'todos'
    )
  );

