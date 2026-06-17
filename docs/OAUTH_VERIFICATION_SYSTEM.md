# OAuth Account Verification System

## Overview

Your application now has **strict OAuth account verification**. Only users who:
1. ✅ Sign up with Gmail or GitHub
2. ✅ Complete password setup
3. ✅ Have their account verified in the database

Can access the dashboard.

## Security Flow

### Dashboard Access Control

```
User tries to access /dashboard
            ↓
checkOAuthUser() middleware runs
            ↓
┌──────────────────────────────────────────────┐
│ Check 1: Is user logged in?                  │
├──────────────────────────────────────────────┤
│ ❌ NO  → Redirect to /auth/login             │
│ ✅ YES → Continue to Check 2                 │
└──────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────┐
│ Check 2: Does user profile exist?            │
├──────────────────────────────────────────────┤
│ ❌ NO  → Redirect to /auth/login             │
│ ✅ YES → Continue to Check 3                 │
└──────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────┐
│ Check 3: Does profile have OAuth provider?   │
│ (gmail/github required)                      │
├──────────────────────────────────────────────┤
│ ❌ NO  → Redirect to /auth/unauthorized      │
│ ✅ YES → Continue to Check 4                 │
└──────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────┐
│ Check 4: Has password been set?              │
├──────────────────────────────────────────────┤
│ ❌ NO  → Redirect to /auth/setup-password    │
│ ✅ YES → Continue to Dashboard               │
└──────────────────────────────────────────────┘
            ↓
✅ DASHBOARD ACCESS GRANTED
```

## Verification Points

### 1. Callback Route (`/auth/callback`)

**What it does:**
- Verifies OAuth code from provider
- Checks user profile in database
- Confirms OAuth provider is set
- Validates password setup is complete

**For Signup Flow:**
```
User completes OAuth → /auth/callback?flow=signup
                    → Verify code
                    → Verify user exists
                    → Redirect to /auth/setup-password
```

**For Login Flow:**
```
User completes OAuth → /auth/callback
                    → Verify code
                    → Verify profile has oauth_provider
                    → Verify password_set = true
                    → Redirect to /dashboard OR /auth/unauthorized
```

### 2. Dashboard Middleware (`checkOAuthUser()`)

**Located in:** `lib/supabase/oauth-middleware.ts`

**Verification Steps:**
```typescript
1. Get authenticated user from session
   ↓
2. Fetch user's profile from database
   ↓
3. Check profile.oauth_provider is set (google/github)
   ↓
4. Check profile.password_set = true
   ↓
5. Return user or redirect
```

### 3. Database Checks

**Profile Table Columns:**
```sql
- oauth_provider     → 'google' | 'github' | NULL
- password_set       → true | false
- oauth_signup_date  → When OAuth account was created
```

**RLS Policies:**
- Users can only access their own profile
- OAuth provider field is immutable after first signup

## Error Handling

### Scenario 1: User Not Logged In
```
❌ Action: Tries to access /dashboard
→ Middleware detects: No user session
→ Redirect to: /auth/login
```

### Scenario 2: OAuth Provider Not Set
```
❌ Action: Tries to access /dashboard with email/password account
→ Middleware detects: oauth_provider is NULL
→ Redirect to: /auth/unauthorized
→ Shows: "Access Denied" message
→ Options: Sign up with Gmail/GitHub or login with Gmail/GitHub
```

### Scenario 3: Password Not Yet Set
```
❌ Action: Tries to access /dashboard after OAuth signup
→ Middleware detects: password_set = false
→ Redirect to: /auth/setup-password
→ Shows: Password setup form
```

### Scenario 4: Unregistered User Tries OAuth Login
```
❌ Action: User with unregistered Gmail/GitHub tries to login
→ OAuth provider authenticates user
→ Callback checks: Is profile in database?
→ Profile exists but: oauth_provider = NULL (wrong account type)
→ Redirect to: /auth/unauthorized
→ Message: "Account not registered. Please sign up first."
```

## Protected Routes

### Routes with OAuth Enforcement

| Route | Requirement | Redirect If Fails |
|-------|-------------|------------------|
| `/dashboard` | OAuth + Password Set | `/auth/login` or `/auth/unauthorized` |
| `/formulas` | OAuth + Password Set | `/auth/login` or `/auth/unauthorized` |
| `/notes` | OAuth + Password Set | `/auth/login` or `/auth/unauthorized` |
| `/urls` | OAuth + Password Set | `/auth/login` or `/auth/unauthorized` |
| `/todos` | OAuth + Password Set | `/auth/login` or `/auth/unauthorized` |
| `/shortcuts` | OAuth + Password Set | `/auth/login` or `/auth/unauthorized` |

## Implementation Details

### Callback Route Changes

**New Validations:**
```typescript
// 1. Exchange OAuth code for session
const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

// 2. Get authenticated user
const { data: { user } } = await supabase.auth.getUser()

// 3. Verify profile exists and has OAuth provider
const { data: profile } = await supabase
  .from("profiles")
  .select("oauth_provider, password_set")
  .eq("id", user.id)
  .single()

// 4. Check oauth_provider is not null
if (!profile.oauth_provider) {
  redirect("/auth/unauthorized")
}

// 5. Check password is set (except for signup flow)
if (!profile.password_set) {
  redirect("/auth/setup-password")
}
```

### Middleware Checks

**Enhanced `checkOAuthUser()` function:**
```typescript
// 1. Check user session exists
if (!user) redirect("/auth/login")

// 2. Check profile exists in database
if (error || !profile) redirect("/auth/login")

// 3. Check OAuth provider is set (Gmail or GitHub)
if (!profile.oauth_provider) redirect("/auth/unauthorized")

// 4. Check password has been set
if (!profile.password_set) redirect("/auth/setup-password")

// 5. All checks passed - allow access
return { user, profile }
```

## User Experience Flow

### Correct Path: Gmail User
```
1. User clicks Gmail on signup
2. Authenticates with Gmail
3. Redirected to /auth/setup-password
4. Sets username and password
5. Profile updated: oauth_provider='google', password_set=true
6. Redirected to /dashboard
7. ✅ Can access all features
```

### Correct Path: GitHub User
```
1. User clicks GitHub on signup
2. Authenticates with GitHub
3. Redirected to /auth/setup-password
4. Sets username and password
5. Profile updated: oauth_provider='github', password_set=true
6. Redirected to /dashboard
7. ✅ Can access all features
```

### Blocked Path: Unregistered User
```
1. User clicks Gmail on login
2. Authenticates with Gmail (account not in system)
3. Redirected to /auth/callback
4. User added to database with oauth_provider='google'
5. But: New OAuth users marked as password_set=false
6. Callback detects: password_set=false
7. Redirected to /auth/setup-password
   OR if already registered with password:
8. oauth_provider is set
9. password_set is true
10. ✅ Redirected to dashboard

If user never completed signup:
1. Profile exists but password_set=false
2. Redirected to /auth/setup-password
```

### Blocked Path: Email/Password User
```
1. User created account with email/password (old method)
2. Tries to access /dashboard
3. checkOAuthUser() runs
4. Detects: oauth_provider = NULL
5. Redirected to /auth/unauthorized
6. Shows error message
7. Options: Sign up with Gmail/GitHub
```

## Database State Tracking

### OAuth Signup User State

**After Gmail/GitHub Authentication:**
```
oauth_provider: 'google' or 'github'
password_set: false
oauth_signup_date: [timestamp]
```

**After Password Setup:**
```
oauth_provider: 'google' or 'github'
password_set: true
oauth_signup_date: [timestamp]
last_password_change: [timestamp]
```

### Email/Password User State

**For Backward Compatibility:**
```
oauth_provider: NULL
password_set: true
oauth_signup_date: NULL
```

**These users:** ❌ Cannot access dashboard (unless allowed by future changes)

## Security Features

### 1. OAuth Provider Enforcement
- ✅ Only Gmail and GitHub allowed
- ✅ Provider cannot be changed after initial setup
- ✅ Verified at database level

### 2. Password Requirement
- ✅ All users (even OAuth) must set password
- ✅ Password is encrypted in Supabase Auth
- ✅ Last change timestamp tracked

### 3. Double-Check System
- ✅ Verification at OAuth callback
- ✅ Verification at middleware (before dashboard)
- ✅ Protection against session tampering

### 4. Database Constraints
- ✅ Unique usernames
- ✅ Unique emails
- ✅ RLS policies on all tables
- ✅ Indexes for performance

## Testing Scenarios

### Test 1: Valid OAuth Signup
- [ ] Click Gmail on signup
- [ ] Authenticate
- [ ] Complete password setup
- [ ] Access dashboard ✅

### Test 2: Valid OAuth Login
- [ ] Same Gmail account
- [ ] Click Gmail on login
- [ ] Immediately access dashboard ✅

### Test 3: Unregistered User
- [ ] Different Gmail account
- [ ] Click Gmail on login
- [ ] Verify: Redirected to unauthorized or setup-password
- [ ] Cannot directly access dashboard ✅

### Test 4: Wrong Account Type
- [ ] Try to access with email/password
- [ ] Verify: Blocked at middleware
- [ ] Redirected to unauthorized ✅

### Test 5: Incomplete Signup
- [ ] Start signup but don't complete password setup
- [ ] Try to access dashboard
- [ ] Verify: Redirected to setup-password ✅

## Admin Queries

**Check user is properly set up:**
```sql
SELECT id, email, oauth_provider, password_set, created_at
FROM profiles
WHERE id = 'user_id_here';
```

**Find users without OAuth:**
```sql
SELECT id, email, oauth_provider, password_set
FROM profiles
WHERE oauth_provider IS NULL;
```

**Find incomplete OAuth signups:**
```sql
SELECT id, email, oauth_provider, password_set, oauth_signup_date
FROM profiles
WHERE oauth_provider IS NOT NULL 
AND password_set = false;
```

## Future Enhancements

1. **Account Linking**
   - Allow users to link multiple OAuth providers
   - Keep single password for all providers

2. **Email Verification**
   - Require email verification after signup
   - Send welcome email with provider info

3. **Disable Email/Password Login**
   - Optional: Remove non-OAuth login
   - Current: Both allowed

4. **Admin Dashboard**
   - View user OAuth status
   - Manually enable/disable users
   - Export OAuth user list

5. **Two-Factor Authentication**
   - Add 2FA during password setup
   - Support TOTP, SMS, email

## Summary

Your application now has:
- ✅ **Strict OAuth enforcement** - Only Gmail/GitHub users
- ✅ **Password verification** - All users must set password
- ✅ **Multi-layer checks** - Callback + Middleware + Database
- ✅ **Clear error messages** - Unauthorized page explains next steps
- ✅ **Database tracking** - OAuth provider stored and verified
- ✅ **Session security** - Automatic redirects on failure

**Result:** Only properly registered OAuth users can access the dashboard!
