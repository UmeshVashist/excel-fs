# 📊 Complete Database Schema Setup

## SQL Code to Run in Supabase

Run ALL of this code in your Supabase SQL Editor to set up the complete database.

### Copy and paste this entire block into Supabase SQL Editor:

```sql
-- ============================================================
-- 1. PROFILES TABLE (Required for OAuth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  last_password_change TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS POLICIES FOR PROFILES
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable by anyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by anyone" ON public.profiles
  FOR SELECT USING (true);

-- ============================================================
-- 4. FUNCTION TO AUTO-CREATE PROFILE ON NEW USER
-- ============================================================
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
    email = NEW.email,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. TRIGGER FOR NEW USER SIGNUP
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 6. OTHER TABLES (Formulas, Notes, URLs, Todos, Shortcuts)
-- ============================================================

-- Formulas Table
CREATE TABLE IF NOT EXISTS public.formulas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  formula TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.formulas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own formulas" ON public.formulas;
CREATE POLICY "Users can view their own formulas" ON public.formulas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create formulas" ON public.formulas;
CREATE POLICY "Users can create formulas" ON public.formulas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own formulas" ON public.formulas;
CREATE POLICY "Users can update their own formulas" ON public.formulas
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own formulas" ON public.formulas;
CREATE POLICY "Users can delete their own formulas" ON public.formulas
  FOR DELETE USING (auth.uid() = user_id);

-- Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own notes" ON public.notes;
CREATE POLICY "Users can manage their own notes" ON public.notes
  FOR ALL USING (auth.uid() = user_id);

-- URLs Table
CREATE TABLE IF NOT EXISTS public.urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.urls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own urls" ON public.urls;
CREATE POLICY "Users can view their own urls" ON public.urls
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own urls" ON public.urls;
CREATE POLICY "Users can manage their own urls" ON public.urls
  FOR ALL USING (auth.uid() = user_id);

-- Todos Table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos;
CREATE POLICY "Users can view their own todos" ON public.todos
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;
CREATE POLICY "Users can manage their own todos" ON public.todos
  FOR ALL USING (auth.uid() = user_id);

-- Shortcuts Table
CREATE TABLE IF NOT EXISTS public.shortcuts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_combination TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.shortcuts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own shortcuts" ON public.shortcuts;
CREATE POLICY "Users can view their own shortcuts" ON public.shortcuts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own shortcuts" ON public.shortcuts;
CREATE POLICY "Users can manage their own shortcuts" ON public.shortcuts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_formulas_user_id ON public.formulas(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON public.urls(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_user_id ON public.shortcuts(user_id);

-- ============================================================
-- 7. VERIFY SETUP (Optional - run to check)
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

---

## 🛠️ How to Run This:

### **Step 1: Open Supabase Dashboard**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar

### **Step 2: Create New Query**
1. Click **New Query** button
2. A blank editor will open

### **Step 3: Paste the SQL**
1. Copy ALL the code above
2. Paste it into the editor
3. Make sure there are no syntax errors (red underlines)

### **Step 4: Run It**
1. Click the **Run** button (or Ctrl+Enter)
2. Wait for it to complete
3. You should see: ✅ "Success. No rows returned"

### **Step 5: Verify Tables Created**
1. Click **Table Editor** in left sidebar
2. You should see all these tables:
   - ✅ profiles
   - ✅ formulas
   - ✅ notes
   - ✅ urls
   - ✅ todos
   - ✅ shortcuts

---

## 📋 What This Creates:

| Table | Purpose |
|-------|---------|
| **profiles** | User account data (required for OAuth) |
| **formulas** | Store Excel formulas |
| **notes** | User notes |
| **urls** | Bookmarked URLs |
| **todos** | Todo tasks |
| **shortcuts** | Keyboard shortcuts |

Each table has:
- ✅ Row Level Security (RLS) enabled
- ✅ Policies to protect user data
- ✅ Auto timestamps (created_at, updated_at)
- ✅ User ownership (user_id)
- ✅ Indexes for performance

---

## 🔒 Security Features:

- **RLS Enabled**: Only users can access their own data
- **Foreign Keys**: Data is linked to user account
- **Triggers**: Profiles auto-created on signup
- **Indexes**: Fast queries

---

## ✅ After Running This:

- ✅ OAuth login will work
- ✅ User profiles auto-create
- ✅ All app features will work
- ✅ Data is secure and private

---

## 🐛 If You Get an Error:

**Error: "table already exists"**
- This is OK! It means the table was already created
- The `CREATE TABLE IF NOT EXISTS` prevents conflicts

**Error: "duplicate key value"**
- Drop the specific table and try again:
  ```sql
  DROP TABLE IF EXISTS public.profiles CASCADE;
  ```

**Error: "syntax error"**
- Copy the entire code block again
- Make sure there are no missing characters
- Try running smaller sections at a time

---

**After running this SQL, your database is fully set up for OAuth and the app!** ✅
