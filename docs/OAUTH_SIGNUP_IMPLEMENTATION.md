# OAuth Signup Implementation Guide

## Overview

This document explains the new OAuth signup functionality that has been added to the application. Users can now sign up using Gmail or GitHub, and will be prompted to set up their password and username after authentication.

## Flow Diagram

```
User clicks "Gmail" or "GitHub" on Signup Page
         ↓
OAuth provider login page opens
         ↓
User authenticates with provider
         ↓
Redirects to /auth/callback?flow=signup
         ↓
Exchange code for session
         ↓
User redirected to /auth/setup-password
         ↓
User sets password and username
         ↓
Profile updated in database
         ↓
User redirected to /dashboard
```

## Features Implemented

### 1. OAuth Signup Buttons on Signup Page
- **Location**: `app/auth/sign-up/page.tsx`
- **Providers**: Gmail and GitHub
- **UI**: Clean card-based design with icons and loading states
- Both buttons redirect to OAuth setup page or email/password form

### 2. OAuth Signup Actions
- **Location**: `app/auth/sign-up/actions.ts`
- **Functions**:
  - `signUpWithGmail()` - Initiates Gmail OAuth flow
  - `signUpWithGithub()` - Initiates GitHub OAuth flow
  - `signUpWithEmail()` - Traditional email/password signup

### 3. Password Setup Page
- **Location**: `app/auth/setup-password/`
- **Purpose**: Allows OAuth users to set their password and username after signup
- **Features**:
  - Username field
  - Password creation with visibility toggle
  - Password confirmation field
  - Client-side validation
  - Error handling
  - Loading states

### 4. Password Setup Actions
- **Location**: `app/auth/setup-password/actions.ts`
- **Functions**:
  - `setupPassword()` - Updates user password and username

### 5. Updated Callback Route
- **Location**: `app/auth/callback/route.ts`
- **Changes**:
  - Detects `flow=signup` query parameter
  - Routes OAuth signup users to password setup page
  - Routes OAuth login users directly to dashboard

## Database Changes

### New Columns in `profiles` Table

```sql
- oauth_provider: TEXT (stores 'google', 'github', or NULL)
- password_set: BOOLEAN (tracks if password has been configured)
- oauth_signup_date: TIMESTAMP (when OAuth account was created)
```

### Updated Trigger Function

The `handle_new_user()` function has been updated to:
- Detect OAuth signups
- Set `oauth_provider` based on authentication provider
- Set `password_set` appropriately
- Generate unique usernames for OAuth users

## Installation Steps

### Step 1: Configure OAuth Providers in Supabase

Follow these guides to set up OAuth:
- [Gmail OAuth Setup](docs/OAUTH_SETUP_GUIDE.md#setting-up-gmail-oauth)
- [GitHub OAuth Setup](docs/OAUTH_SETUP_GUIDE.md#setting-up-github-oauth)

### Step 2: Run Database Migration

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `scripts/005-add-oauth-tracking.sql`
3. Execute the SQL

This will:
- Add new columns to the `profiles` table
- Update the `handle_new_user()` function
- Create an index for `oauth_provider`

### Step 3: Update Environment Variables

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Usage

### For Users - Signup

1. Navigate to the signup page
2. Choose an option:
   - **Gmail**: Click "Gmail" button
   - **GitHub**: Click "GitHub" button
   - **Email**: Fill out the form and click "Create Account"
3. For OAuth users:
   - Authenticate with provider
   - Set password and username on the setup page
   - Redirected to dashboard
4. For Email signup:
   - Verify email
   - Redirected to success page

### For Users - Login

1. Navigate to login page
2. Choose an option:
   - **Gmail**: Click "Gmail" button
   - **GitHub**: Click "GitHub" button
   - **Email/Username**: Enter credentials and click "Sign in"

## Security Considerations

1. **OAuth Flow Security**:
   - Uses Supabase's OAuth flow (industry standard)
   - CSRF protection built in
   - Secure token exchange

2. **Password Requirements**:
   - Minimum 6 characters (enforced on client and server)
   - Passwords updated in Supabase Auth
   - `last_password_change` timestamp tracked

3. **User Uniqueness**:
   - Usernames are unique in profiles table
   - Email addresses are unique in auth.users table
   - OAuth provider emails are unique

4. **RLS Policies**:
   - Users can only view/edit their own profiles
   - Row-level security enforced in Supabase

## Database Schema Reference

```sql
-- OAuth Tracking Fields in Profiles
CREATE TABLE public.profiles (
  ...existing fields...
  oauth_provider TEXT,        -- 'google', 'github', or NULL
  password_set BOOLEAN DEFAULT false,
  oauth_signup_date TIMESTAMP WITH TIME ZONE,
  ...
)
```

## Testing

### Test OAuth Signup

1. Go to `/auth/sign-up`
2. Click "Gmail" or "GitHub"
3. Use test account to authenticate
4. Verify redirected to `/auth/setup-password`
5. Set password and username
6. Verify redirected to `/dashboard`

### Test OAuth Login

1. Go to `/auth/login`
2. Click "Gmail" or "GitHub" with same account
3. Should be redirected directly to `/dashboard`

### Test Traditional Signup

1. Go to `/auth/sign-up`
2. Fill form with email and password
3. Submit and verify redirect to success page

## Troubleshooting

### OAuth button shows "Unsupported provider"

**Solution**: 
- Check that OAuth provider is enabled in Supabase
- Verify Client ID and Secret are configured correctly
- See docs/OAUTH_ERROR_QUICK_FIX.md

### User redirected to login instead of setup page

**Possible causes**:
- Flow parameter missing from redirect URL
- Session not properly established
- Cookie issues

**Solution**:
- Check browser developer console for errors
- Verify callback URL in Supabase OAuth settings
- Clear browser cookies and try again

### Password setup fails

**Possible causes**:
- Password too short (< 6 characters)
- Username already taken
- Database connection issue

**Solution**:
- Check error message displayed
- Verify database connection
- Check `profiles` table for existing username

## Files Changed

1. `app/auth/sign-up/page.tsx` - Added OAuth buttons
2. `app/auth/sign-up/actions.ts` - Created with OAuth functions
3. `app/auth/setup-password/page.tsx` - New file
4. `app/auth/setup-password/actions.ts` - New file
5. `app/auth/callback/route.ts` - Updated to handle signup flow
6. `scripts/005-add-oauth-tracking.sql` - Database migration

## Future Enhancements

1. **Two-factor authentication (2FA)**:
   - Add option during password setup
   - Support TOTP, email, or SMS

2. **Social account linking**:
   - Allow users to link multiple OAuth providers
   - Link OAuth to existing email accounts

3. **Profile customization**:
   - Avatar upload during setup
   - Bio/profile information

4. **Email verification**:
   - Verify email before allowing dashboard access
   - Send confirmation emails for OAuth users

## API Documentation

### OAuth Routes

#### POST `/auth/sign-up` (actions)
- `signUpWithGmail()` - Initiates Gmail OAuth
- `signUpWithGithub()` - Initiates GitHub OAuth
- `signUpWithEmail(username, email, password)` - Email signup

#### POST `/auth/setup-password` (actions)
- `setupPassword(password, username)` - Sets password for OAuth users

#### GET `/auth/callback`
- **Query Parameters**:
  - `code` - Authorization code from OAuth provider
  - `flow` - "signup" or undefined (for login)
  - `error` - Error code if authentication failed

## Related Documentation

- [OAuth Setup Guide](docs/OAUTH_SETUP_GUIDE.md)
- [OAuth Error Quick Fix](docs/OAUTH_ERROR_QUICK_FIX.md)
- [Complete Database Schema](docs/COMPLETE_DATABASE_SCHEMA.md)
- [Authentication System Overview](docs/LOCAL_DEVELOPMENT_SETUP.md)
