# 🔧 Supabase OAuth Configuration Checklist

## Error: "Unsupported provider: provider is not enabled"

---

## ✅ Complete Setup Checklist

### **Section 1: Prepare Your Information**

- [ ] Have your Supabase Project ID ready
  - Get it from: Supabase Dashboard → Settings → General
  - It looks like: `xyza1b2c3d4e5f6g`

- [ ] Know your app URL
  - Local: `http://localhost:3000`
  - Production: `https://yourdomain.com`

---

### **Section 2: Set Up Google OAuth**

#### **2.1 - Google Cloud Console Setup**

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create a new project (or use existing)
- [ ] Search for **"Google+ API"** in Library
- [ ] Click **Enable**
- [ ] Go to **APIs & Services** → **Credentials**
- [ ] Click **Create Credentials** → **OAuth client ID**
- [ ] Choose **Web application**
- [ ] Add Authorized redirect URI:
  ```
  https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback?provider=google
  ```
- [ ] For local testing, also add:
  ```
  http://localhost:3000/auth/callback
  ```
- [ ] Click **Create**
- [ ] **Copy Client ID:** `________________`
- [ ] **Copy Client Secret:** `________________`

#### **2.2 - Enable Google in Supabase**

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Authentication** in sidebar
4. Click **Providers**
5. Find **Google** in the list
6. **Important:** Toggle the switch to **ON** ✅
7. Paste **Client ID** in the "Client ID" field
8. Paste **Client Secret** in the "Client Secret" field
9. Click **Save** button

- [ ] Google provider is **ENABLED** (toggle is ON)
- [ ] Client ID pasted
- [ ] Client Secret pasted
- [ ] Saved

✅ **Google OAuth is now active!**

---

### **Section 3: Set Up GitHub OAuth**

#### **3.1 - GitHub Developer Settings**

- [ ] Go to [GitHub Developer Settings](https://github.com/settings/developers)
- [ ] Click **New OAuth App**
- [ ] Fill in:
  - **Application name:** `Your App Name`
  - **Homepage URL:** `http://localhost:3000` (or your domain)
  - **Authorization callback URL:**
    ```
    https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback?provider=github
    ```
- [ ] Click **Register application**
- [ ] You should see Client ID and Client Secret on the next page
- [ ] **Copy Client ID:** `________________`
- [ ] Click **Generate a new client secret**
- [ ] **Copy Client Secret:** `________________`

#### **3.2 - Enable GitHub in Supabase**

1. Open Supabase Dashboard
2. Click **Authentication** in sidebar
3. Click **Providers**
4. Find **GitHub** in the list
5. **Important:** Toggle the switch to **ON** ✅
6. Paste **Client ID** in the "Client ID" field
7. Paste **Client Secret** in the "Client Secret" field
8. Click **Save** button

- [ ] GitHub provider is **ENABLED** (toggle is ON)
- [ ] Client ID pasted
- [ ] Client Secret pasted
- [ ] Saved

✅ **GitHub OAuth is now active!**

---

### **Section 4: Verify Your Setup**

- [ ] `.env.local` file contains:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

- [ ] Both providers show as **enabled** (ON) in Supabase dashboard

---

### **Section 5: Test It Works**

1. **Stop your app** if running
2. **Start your app:**
   ```bash
   npm run dev
   ```
3. **Open** `http://localhost:3000/auth/login`
4. **Click Gmail button**
   - [ ] Redirects to Google login page
   - [ ] Can login with your Google account
   - [ ] Redirects back to app
   - [ ] Successfully logged in

5. **Logout and test GitHub**
   - [ ] Click **Gmail** button (or GitHub after logout)
   - [ ] Click GitHub button
   - [ ] Redirects to GitHub login page
   - [ ] Can login with your GitHub account
   - [ ] Redirects back to app
   - [ ] Successfully logged in

✅ **Everything works!**

---

## 🚨 Troubleshooting

### **Still seeing "Unsupported provider" error?**

**Problem:** Provider toggle is OFF in Supabase

**Solution:**
1. Go to Supabase Dashboard
2. Authentication → Providers
3. Check that both Google AND GitHub toggles are **ON** (blue)
4. Refresh your browser and try again

---

### **Error: "Invalid redirect URI"**

**Problem:** The redirect URL doesn't match exactly

**Solution:**
1. Copy the redirect URL from Supabase auth settings
2. Paste it EXACTLY (including `?provider=google` or `?provider=github`)
3. Don't add extra slashes or change capitalization

---

### **Error: "Invalid client ID/secret"**

**Problem:** Wrong credentials pasted

**Solution:**
1. Go back to Google Cloud Console or GitHub Settings
2. Copy the credentials again (not from memory)
3. Paste them again in Supabase
4. Make sure there are no extra spaces

---

### **Redirects but then error?**

**Problem:** After logging in, it shows an error

**Solution:**
1. Check your `.env.local` file
2. Make sure `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
4. Restart your app

---

## 📋 Reference URLs

### **For Your Records:**

**Google Callback URL:**
```
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback?provider=google
```

**GitHub Callback URL:**
```
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback?provider=github
```

**Local Testing Callback:**
```
http://localhost:3000/auth/callback
```

**Supabase Project Settings:**
```
https://supabase.com/dashboard/project/YOUR_PROJECT_ID
```

---

## ✨ Final Checklist

- [ ] Google OAuth enabled in Supabase
- [ ] GitHub OAuth enabled in Supabase
- [ ] Both toggles are **ON** (blue)
- [ ] Credentials pasted correctly
- [ ] `.env.local` file updated
- [ ] App restarted (`npm run dev`)
- [ ] Login page loads at `/auth/login`
- [ ] Gmail button works
- [ ] GitHub button works
- [ ] Can successfully login with both methods

✅ **You're all set! OAuth is working!**

---

## 🔗 Quick Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [GitHub Developer Settings](https://github.com/settings/developers)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login)

---

**Still stuck?** Double-check:
1. Both provider toggles are **ON** in Supabase ✅
2. Credentials are copied correctly ✅
3. Redirect URLs match exactly ✅
4. App is running on `http://localhost:3000` ✅
