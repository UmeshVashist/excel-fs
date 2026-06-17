# 🔴 FIX: GET /auth/callback 307 Error

## ❌ Error You're Seeing:
```
GET /auth/callback?code=038e53e3-739f-4aed-beb3-95e81afefa72 307 google
```

This means the OAuth login started but failed at the callback stage.

---

## ✅ Step-by-Step Fix (Do These in Order)

### **Step 1: Fix Your `.env.local` File**

Your `.env.local` file should have:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmtzcXp1aWF2bHdybnRleWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDEzMzksImV4cCI6MjA4MjY3NzMzOX0.3z0vfh-hLiBKGwwCgRJ1YIavbWxfeIHB1m1RKkV_UO8"

NEXT_PUBLIC_SUPABASE_URL="https://lzfksqzuiavlwrnteykt.supabase.co"

NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth Credentials (get from Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=""

# GitHub OAuth Credentials (get from GitHub)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

✅ Already done! Your `.env.local` is updated.

---

### **Step 2: Setup Database Table**

Your Supabase database needs a `profiles` table for user data.

**Do this:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `lzfksqzuiavlwrnteykt`
3. Click **SQL Editor** in sidebar
4. Click **New Query**
5. Copy this entire SQL code:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by anyone" ON public.profiles
  FOR SELECT USING (true);

-- Create trigger to auto-create profile on user signup
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
    email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

6. Click **Run** button
7. Wait for: ✅ "Success. No rows returned"

---

### **Step 3: Configure OAuth Providers in Supabase**

#### **For Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Search for **"Google+ API"** and enable it
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add redirect URL:
   ```
   https://lzfksqzuiavlwrnteykt.supabase.co/auth/v1/callback?provider=google
   ```
7. Click **Create**
8. Copy your **Client ID** and **Client Secret**
9. Go to Supabase Dashboard → **Authentication** → **Providers**
10. Click **Google**
11. **Enable** toggle (make it ON/blue)
12. Paste **Client ID**
13. Paste **Client Secret**
14. Click **Save**

✅ **Google is now enabled!**

#### **For GitHub OAuth:**

1. Go to [GitHub Settings → Developer settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** Your app name
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:**
     ```
     https://lzfksqzuiavlwrnteykt.supabase.co/auth/v1/callback?provider=github
     ```
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret**
7. Copy **Client Secret**
8. Go to Supabase Dashboard → **Authentication** → **Providers**
9. Click **GitHub**
10. **Enable** toggle (make it ON/blue)
11. Paste **Client ID**
12. Paste **Client Secret**
13. Click **Save**

✅ **GitHub is now enabled!**

---

### **Step 4: Restart Your App**

1. **Stop your app** (Ctrl+C in terminal)
2. **Start it again:**
   ```bash
   npm run dev
   ```
3. **Go to:** `http://localhost:3000/auth/login`

---

### **Step 5: Test It**

1. Click **Gmail** button
2. Login with your Google account
3. After successful login, you should be on the **dashboard**
4. **Logout** and test GitHub

✅ **If it works, you're done!**

---

## 🐛 If You Still Get the 307 Error:

### **Check 1: Are the providers ENABLED?**

- Go to Supabase Dashboard
- Click **Authentication** → **Providers**
- Make sure both **Google** AND **GitHub** toggles are **ON** (blue)
- If OFF (gray), toggle them ON and Save

### **Check 2: Did you create the profiles table?**

- Go to Supabase Dashboard
- Click **SQL Editor** → **New Query**
- Run: `SELECT * FROM public.profiles;`
- If it says "table doesn't exist", run the SQL from Step 2

### **Check 3: Check your credentials**

- Make sure Client ID and Client Secret are pasted correctly
- No extra spaces or line breaks
- They match what Google/GitHub gave you

### **Check 4: Browser console**

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Click Gmail button again
4. Look for errors in console
5. Screenshot and check the error message

### **Check 5: Restart everything**

```bash
# Stop the app
Ctrl+C

# Clear cache
rm -r .next

# Start again
npm run dev
```

---

## 📋 Checklist Before Testing

- [ ] `.env.local` file is updated with correct URLs
- [ ] `profiles` table created in Supabase
- [ ] Google provider is **ENABLED** (toggle ON)
- [ ] GitHub provider is **ENABLED** (toggle ON)
- [ ] Google credentials (Client ID & Secret) pasted in Supabase
- [ ] GitHub credentials (Client ID & Secret) pasted in Supabase
- [ ] App restarted with `npm run dev`

---

## 🔗 Quick Links

- Your Supabase URL: `https://lzfksqzuiavlwrnteykt.supabase.co`
- [Google Cloud Console](https://console.cloud.google.com/)
- [GitHub Developer Settings](https://github.com/settings/developers)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

**After completing all steps, the 307 error should be gone and OAuth login will work!** ✅
