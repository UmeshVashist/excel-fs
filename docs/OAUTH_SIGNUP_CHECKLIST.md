# OAuth Signup Implementation Checklist

## Prerequisites ✅ Check These First

- [ ] Gmail OAuth configured in Supabase
  - [ ] Google OAuth 2.0 credentials created
  - [ ] Client ID obtained
  - [ ] Client Secret obtained
  - [ ] Redirect URI set in Google Cloud Console
  
- [ ] GitHub OAuth configured in Supabase  
  - [ ] GitHub OAuth App created
  - [ ] Client ID obtained
  - [ ] Client Secret obtained
  - [ ] Authorization callback URL set

- [ ] Environment variables configured
  - [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `.env.local` has `NEXT_PUBLIC_APP_URL` (http://localhost:3000 for dev)

## Database Setup

- [ ] Run SQL migration: `scripts/005-add-oauth-tracking.sql`
  - [ ] Copy SQL to Supabase Editor
  - [ ] Execute and verify no errors
  - [ ] Check profiles table has new columns:
    - [ ] `oauth_provider`
    - [ ] `password_set`
    - [ ] `oauth_signup_date`

## Files Verification

- [ ] `app/auth/sign-up/page.tsx`
  - [ ] Has Gmail button
  - [ ] Has GitHub button
  - [ ] Imports OAuth actions

- [ ] `app/auth/sign-up/actions.ts` exists
  - [ ] Has `signUpWithGmail()`
  - [ ] Has `signUpWithGithub()`
  - [ ] Has `signUpWithEmail()`

- [ ] `app/auth/setup-password/page.tsx` exists
  - [ ] Username field present
  - [ ] Password field present
  - [ ] Confirm password field present

- [ ] `app/auth/setup-password/actions.ts` exists
  - [ ] Has `setupPassword()` function

- [ ] `app/auth/callback/route.ts` updated
  - [ ] Checks for `flow=signup` parameter
  - [ ] Redirects to `/auth/setup-password` for signup
  - [ ] Redirects to `/dashboard` for login

## Testing Checklist

### OAuth Signup Flow
1. [ ] Navigate to `/auth/sign-up`
2. [ ] Click Gmail button
3. [ ] Authenticate with test Gmail account
4. [ ] Verify redirected to `/auth/setup-password`
5. [ ] Fill in username and password
6. [ ] Submit and verify success
7. [ ] Check profile table has oauth_provider='google'
8. [ ] Verify can login with username/password

### OAuth Signup Flow (GitHub)
1. [ ] Navigate to `/auth/sign-up`
2. [ ] Click GitHub button
3. [ ] Authenticate with test GitHub account
4. [ ] Verify redirected to `/auth/setup-password`
5. [ ] Fill in username and password
6. [ ] Submit and verify success
7. [ ] Check profile table has oauth_provider='github'

### OAuth Login Flow
1. [ ] Create account via Gmail OAuth
2. [ ] Set password and username
3. [ ] Logout
4. [ ] Go to `/auth/login`
5. [ ] Click Gmail button
6. [ ] Verify redirected directly to `/dashboard`

### Email Signup (Traditional)
1. [ ] Navigate to `/auth/sign-up`
2. [ ] Fill in username, email, password
3. [ ] Submit
4. [ ] Verify redirected to success page
5. [ ] Check profile table has password_set=true

## Performance Considerations

- [ ] OAuth buttons have loading states
- [ ] Password setup page validates on client
- [ ] Database indexes created for oauth_provider
- [ ] No N+1 queries in profile lookups

## Security Checks

- [ ] Minimum password length enforced (6 chars)
- [ ] Usernames are unique
- [ ] RLS policies protect user data
- [ ] OAuth tokens not stored insecurely
- [ ] CSRF protection active on all forms

## Troubleshooting

If issues occur:

1. **"Unsupported provider" error**
   - [ ] Check OAuth enabled in Supabase Dashboard
   - [ ] Verify Client ID and Secret are set
   - [ ] See: docs/OAUTH_ERROR_QUICK_FIX.md

2. **User not redirected to setup page**
   - [ ] Check browser console for errors
   - [ ] Verify `flow=signup` in callback URL
   - [ ] Check session is created properly

3. **Username already taken error**
   - [ ] Verify unique constraint on username
   - [ ] Check for duplicate entries in profiles table
   - [ ] Use migration script to clean duplicates if needed

4. **Password setup fails**
   - [ ] Check password meets minimum length
   - [ ] Verify Supabase connection is active
   - [ ] Check browser console for CORS errors

## Optional Enhancements

- [ ] Add email verification for OAuth users
- [ ] Implement password reset flow
- [ ] Add 2FA support
- [ ] Allow account recovery with backup codes
- [ ] Add profile picture upload
- [ ] Show password requirements in real-time

## Deployment Checklist

- [ ] Database migration applied to production
- [ ] OAuth credentials verified in prod Supabase
- [ ] Environment variables set for production
- [ ] Load testing completed
- [ ] Error handling verified
- [ ] User documentation updated

## Support Resources

- **OAuth Setup**: docs/OAUTH_SETUP_GUIDE.md
- **OAuth Errors**: docs/OAUTH_ERROR_QUICK_FIX.md
- **Database Schema**: docs/COMPLETE_DATABASE_SCHEMA.md
- **Implementation Details**: docs/OAUTH_SIGNUP_IMPLEMENTATION.md

---

## Quick Start (Copy-Paste Commands)

If you already have Supabase configured, run these steps:

1. **Apply database migration**:
   - Go to Supabase Dashboard → SQL Editor
   - Open and run: `scripts/005-add-oauth-tracking.sql`

2. **Test OAuth signup**:
   - Go to: `http://localhost:3000/auth/sign-up`
   - Click Gmail or GitHub button
   - Complete the flow

3. **Verify in database**:
   - Check profiles table for new oauth_provider column
   - Verify new user has oauth_provider set

Done! ✅
