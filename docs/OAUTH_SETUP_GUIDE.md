# OAuth Login Setup Guide

This guide explains how to configure Gmail and GitHub OAuth login for your application.

## Prerequisites

- Supabase project account
- Google Cloud Console access
- GitHub account

## Setting Up Gmail OAuth

### Step 1: Create OAuth Credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://YOUR_SUPABASE_URL/auth/v1/callback?provider=google`
     - `http://localhost:3000/auth/callback` (for local development)

5. Copy the **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" and click to expand
4. Enable the provider
5. Paste your Google **Client ID** and **Client Secret**
6. Click "Save"

## Setting Up GitHub OAuth

### Step 1: Create OAuth App in GitHub

1. Go to your GitHub account settings
2. Click "Developer settings" > "OAuth Apps" > "New OAuth App"
3. Fill in the form:
   - **Application name**: Your app name
   - **Homepage URL**: `https://YOUR_DOMAIN.com` or `http://localhost:3000`
   - **Authorization callback URL**: `https://YOUR_SUPABASE_URL/auth/v1/callback?provider=github`

4. Click "Register application"
5. Copy the **Client ID**
6. Generate a new **Client Secret** and copy it

### Step 2: Configure in Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "GitHub" and click to expand
4. Enable the provider
5. Paste your GitHub **Client ID** and **Client Secret**
6. Click "Save"

## Environment Variables

Make sure your `.env.local` file has:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change for production
```

## How It Works

1. User clicks "Gmail" or "GitHub" button on login page
2. They're redirected to the OAuth provider's login page
3. After successful authentication, they're redirected back to `/auth/callback`
4. The callback page exchanges the authorization code for a session
5. User is logged in and redirected to dashboard

## User Profile Setup

After OAuth login, users are automatically created in your `auth.users` table. To create corresponding profile records, add a Supabase trigger:

```sql
-- Create a trigger to automatically create profiles for new OAuth users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- If handle_new_user() function doesn't exist, create it
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Testing Locally

1. Update your Supabase OAuth provider URLs to include `http://localhost:3000/auth/callback`
2. Run your development server: `npm run dev`
3. Click the Gmail or GitHub login buttons
4. After successful OAuth, you should be redirected to your dashboard

## Troubleshooting

- **"Invalid redirect URI"**: Make sure the callback URL in your OAuth provider settings matches exactly with Supabase settings
- **"OAuth error"**: Check browser console for details
- **Session not persisting**: Ensure cookies are properly set in your browser (check Settings > Privacy)

## Security Notes

- Never commit `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_URL` directly; use environment variables
- Always use HTTPS in production
- Client secrets should be stored securely in Supabase dashboard, not in your code
