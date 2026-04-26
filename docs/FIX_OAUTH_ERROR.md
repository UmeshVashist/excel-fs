# 🔐 OAuth Setup - Step by Step Guide

## ❌ Error: "Unsupported provider: provider is not enabled"

This error means the OAuth provider (Google or GitHub) is **NOT configured** in your Supabase dashboard.

---

## ✅ Fix: Enable OAuth Providers in Supabase

### **Step 1: Go to Your Supabase Dashboard**

1. Open [https://supabase.com](https://supabase.com)
2. Login to your account
3. Select your project
4. Click **Authentication** in the left sidebar

---

### **Step 2: Enable Google (Gmail) OAuth**

#### **A) In Your Google Cloud Console:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Search for **"Google+ API"** and enable it
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth client ID**
6. Select **Web application**
7. Add authorized redirect URI:
   ```
   https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback?provider=google
   ```
   *(Replace `[YOUR_PROJECT_ID]` with your Supabase project ID - find it in Supabase settings)*

8. Copy **Client ID** and **Client Secret**

#### **B) In Supabase Dashboard:**

1. Go to **Authentication** → **Providers**
2. Click on **Google**
3. Toggle **Enable Google** to ON
4. Paste the **Client ID** you copied
5. Paste the **Client Secret** you copied
6. Click **Save**

✅ **Google OAuth is now enabled!**

---

### **Step 3: Enable GitHub OAuth**

#### **A) In GitHub Settings:**

1. Go to [GitHub Settings → Developer settings](https://github.com/settings/developers)
2. Click **OAuth Apps** (or create a new OAuth App)
3. Fill in the form:
   - **Application name:** `Your App Name`
   - **Homepage URL:** `http://localhost:3000` (for testing)
   - **Authorization callback URL:**
     ```
     https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback?provider=github
     ```

4. Copy **Client ID** and generate **Client Secret**

#### **B) In Supabase Dashboard:**

1. Go to **Authentication** → **Providers**
2. Click on **GitHub**
3. Toggle **Enable GitHub** to ON
4. Paste the **Client ID**
5. Paste the **Client Secret**
6. Click **Save**

✅ **GitHub OAuth is now enabled!**

---

## 📝 Environment Variables Check

Make sure your `.env.local` file has:

```
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get these from Supabase Dashboard → Settings → API

---

## 🧪 Test Your Setup

1. **Run your app:**
   ```bash
   npm run dev
   ```

2. **Go to login page:**
   ```
   http://localhost:3000/auth/login
   ```

3. **Click Gmail or GitHub button**
   - You should be redirected to the provider's login page
   - After successful login, you'll be redirected to your dashboard

✅ **If it works, congratulations!**

---

## 🐛 Still Getting Error?

### **Check List:**

- [ ] Google provider is toggled **ON** in Supabase
- [ ] GitHub provider is toggled **ON** in Supabase
- [ ] Google Client ID and Secret are correct
- [ ] GitHub Client ID and Secret are correct
- [ ] Redirect URLs match exactly:
  ```
  https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback?provider=google
  https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback?provider=github
  ```
- [ ] Your `.env.local` has correct Supabase URL and keys
- [ ] App is running on `http://localhost:3000`

### **How to Find Your Project ID:**

1. Go to Supabase Dashboard
2. Click **Settings** (gear icon)
3. Go to **General**
4. Copy the **Project ID** from the URL or the field

Example: `https://[project-id].supabase.co`

---

## 🎯 Troubleshooting

| Error | Solution |
|-------|----------|
| "Unsupported provider" | Provider not enabled in Supabase - follow steps above |
| "Invalid redirect URI" | Redirect URL doesn't match - check spelling & capitalization |
| "Invalid client ID/secret" | Credentials are wrong - copy again from Google/GitHub |
| "Redirect URI mismatch" | The return URL from Google/GitHub doesn't match - use exact URL from Supabase |
| Still blank page after login | Check browser console for errors - may need to refresh app |

---

## ✨ Once Setup is Complete

After enabling both providers:
1. Users can click **Gmail** button to login with Google
2. Users can click **GitHub** button to login with GitHub
3. **NO password needed!**
4. User accounts are automatically created on first login

---

## 📞 Quick Reference

**Supabase OAuth Providers URL:**
```
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback?provider=google
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback?provider=github
```

**For Development (Local Testing):**
```
http://localhost:3000/auth/callback
```

Then add to Google/GitHub redirect URLs as well.

---

## 🚀 For Production

Change redirect URLs to your production domain:
```
https://yourdomain.com/auth/callback?provider=google
https://yourdomain.com/auth/callback?provider=github
```
