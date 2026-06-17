# Quick Start: Gmail & GitHub Login Setup

## ⚡ 5-Minute Setup

### Step 1: Enable OAuth Providers in Supabase

1. **Go to Supabase Dashboard** → Select your project
2. Click **Authentication** → **Providers**

#### Enable Google (Gmail)
- Click on **Google**
- Toggle **Enable** switch
- Keep it for now, you'll add credentials next
- Click **Save**

#### Enable GitHub  
- Click on **GitHub**
- Toggle **Enable** switch
- Keep it for now, you'll add credentials next
- Click **Save**

### Step 2: Get Google (Gmail) Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project** (or select existing)
3. Go to **APIs & Services** → **Library**
4. Search for **"Google+ API"** and click **Enable**
5. Go to **APIs & Services** → **Credentials**
6. Click **Create Credentials** → **OAuth client ID**
7. Choose **Web application**
8. Under **Authorized redirect URIs**, add:
   ```
   https://[your-project-id].supabase.co/auth/v1/callback?provider=google
   ```
   (Replace `[your-project-id]` with your actual Supabase project ID)

9. Click **Create**
10. Copy the **Client ID** and **Client Secret**
11. Go back to Supabase → Authentication → Providers → Google
12. Paste **Client ID** and **Client Secret**
13. Click **Save**

### Step 3: Get GitHub Credentials

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: `Your App Name`
   - **Homepage URL**: `http://localhost:3000` (for testing)
   - **Authorization callback URL**: 
     ```
     https://[your-project-id].supabase.co/auth/v1/callback?provider=github
     ```

4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** and copy it
7. Go back to Supabase → Authentication → Providers → GitHub
8. Paste **Client ID** and **Client Secret**
9. Click **Save**

### Step 4: Test It!

1. Run your app: `npm run dev`
2. Go to: `http://localhost:3000/auth/login`
3. Click **Gmail** or **GitHub** button
4. You should be redirected to login with that provider
5. After login, you'll be redirected to dashboard automatically

## ✅ What Works Now

- ✅ Users can login with Gmail - **NO PASSWORD NEEDED**
- ✅ Users can login with GitHub - **NO PASSWORD NEEDED**  
- ✅ First-time users are automatically created
- ✅ User session persists across page refreshes

## 🔍 Testing Checklist

- [ ] Gmail button shows up on login page
- [ ] GitHub button shows up on login page
- [ ] Clicking Gmail redirects to Google login
- [ ] Clicking GitHub redirects to GitHub login
- [ ] After OAuth login, redirects to dashboard
- [ ] You can refresh and stay logged in

## 🚀 For Production

Update redirect URLs in Google/GitHub OAuth settings:
```
https://yourdomain.com/auth/callback
```

Instead of:
```
http://localhost:3000/auth/callback
```

## 📞 Need Help?

See detailed setup guide: [docs/OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md)
See implementation details: [docs/OAUTH_LOGIN_IMPLEMENTATION.md](./OAUTH_LOGIN_IMPLEMENTATION.md)
