# OAuth Account Verification - Visual Guide

## Complete Access Control Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER TRIES TO LOGIN                          │
│                           /auth/login                                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Choose Login │
                    └──┬──────┬───┘
        ┌──────────────┘      └──────────────┐
        │                                     │
    Click Gmail                           Click GitHub
        │                                     │
    ┌───▼────────────────────────────────────▼───┐
    │   AUTHENTICATE WITH OAUTH PROVIDER         │
    │   Google Login / GitHub Login              │
    └───┬────────────────────────────────────────┘
        │
    ┌───▼────────────────────────────────────────┐
    │  USER AUTHENTICATED WITH PROVIDER          │
    │  Provider returns: code                    │
    └───┬────────────────────────────────────────┘
        │
    ┌───▼────────────────────────────────────────┐
    │  REDIRECT TO CALLBACK                      │
    │  /auth/callback?code=XXX&flow=...          │
    └───┬────────────────────────────────────────┘
        │
    ╔═══▼════════════════════════════════════════╗
    ║    CALLBACK VERIFICATION (Level 1)         ║
    ╠════════════════════════════════════════════╣
    ║                                            ║
    ║ Step 1: Exchange code for session          ║
    ║ ─────────────────────────────────────      ║
    ║  ✓ Code received from provider             ║
    ║  ✓ Exchange to session                     ║
    ║  ✓ Session created in auth.users           ║
    ║                                            ║
    ║ Step 2: Get authenticated user             ║
    ║ ─────────────────────────────────────      ║
    ║  ✓ Get user from session                   ║
    ║  ✓ User ID available                       ║
    ║                                            ║
    ║ Step 3: Check flow parameter               ║
    ║ ─────────────────────────────────────      ║
    ║  IF flow = "signup" THEN:                  ║
    ║    → Redirect to /auth/setup-password      ║
    ║    → User sets password                    ║
    ║    → (STOP HERE - User must setup)         ║
    ║  ELSE: (flow = undefined → Login)          ║
    ║    → Continue to Step 4                    ║
    ║                                            ║
    ║ Step 4: Check profile exists               ║
    ║ ─────────────────────────────────────      ║
    ║  Query: SELECT FROM profiles               ║
    ║         WHERE id = user.id                 ║
    ║                                            ║
    ║  IF NOT FOUND:                             ║
    ║    → Redirect to /auth/sign-up             ║
    ║    → (Shouldn't happen - trigger creates)  ║
    ║                                            ║
    ║  IF FOUND: Continue to Step 5              ║
    ║                                            ║
    ║ Step 5: Verify oauth_provider is set       ║
    ║ ─────────────────────────────────────      ║
    ║  Check: profile.oauth_provider             ║
    ║                                            ║
    ║  IF NULL:                                  ║
    ║    → Redirect to /auth/unauthorized        ║
    ║    → Error: "Not a Gmail/GitHub user"      ║
    ║                                            ║
    ║  IF 'google' or 'github': Continue         ║
    ║                                            ║
    ║ Step 6: Verify password_set = true         ║
    ║ ─────────────────────────────────────      ║
    ║  Check: profile.password_set               ║
    ║                                            ║
    ║  IF false:                                 ║
    ║    → Redirect to /auth/setup-password      ║
    ║    → (User needs to complete setup)        ║
    ║                                            ║
    ║  IF true: Continue to Step 7               ║
    ║                                            ║
    ║ Step 7: ALL CHECKS PASSED ✅               ║
    ║ ─────────────────────────────────────      ║
    ║  → Redirect to /dashboard                  ║
    ║                                            ║
    ╚════════════════════════════════════════════╝
        │
        ├─ Setup needed? → /auth/setup-password
        ├─ Not OAuth user? → /auth/unauthorized
        └─ All good? ↓
    
    ┌───▼────────────────────────────────────────┐
    │       USER ACCESSING DASHBOARD             │
    │              /dashboard                    │
    └───┬────────────────────────────────────────┘
        │
    ╔═══▼════════════════════════════════════════╗
    ║  MIDDLEWARE VERIFICATION (Level 2)         ║
    ║  checkOAuthUser() function                 ║
    ╠════════════════════════════════════════════╣
    ║                                            ║
    ║ Check 1: User session exists?              ║
    ║ ─────────────────────────────────────      ║
    ║  IF NO session:                            ║
    ║    ❌ Redirect to /auth/login              ║
    ║                                            ║
    ║ Check 2: Profile exists in DB?             ║
    ║ ─────────────────────────────────────      ║
    ║  IF NOT found:                             ║
    ║    ❌ Redirect to /auth/login              ║
    ║                                            ║
    ║ Check 3: oauth_provider is NOT NULL?       ║
    ║ ─────────────────────────────────────      ║
    ║  IF NULL:                                  ║
    ║    ❌ Redirect to /auth/unauthorized       ║
    ║    → "Account not authorized"              ║
    ║                                            ║
    ║ Check 4: password_set = true?              ║
    ║ ─────────────────────────────────────      ║
    ║  IF false:                                 ║
    ║    ❌ Redirect to /auth/setup-password     ║
    ║                                            ║
    ║ Check 5: All passed? ✅                    ║
    ║ ─────────────────────────────────────      ║
    ║  → Grant dashboard access                  ║
    ║                                            ║
    ╚════════════════════════════════════════════╝
        │
        ├─ Failed any check? Redirect
        └─ All passed? ↓

    ┌───▼────────────────────────────────────────┐
    │      DASHBOARD & PROTECTED PAGES            │
    │  (User can now access all features)         │
    │                                            │
    │  ✓ /dashboard                              │
    │  ✓ /formulas                               │
    │  ✓ /notes                                  │
    │  ✓ /urls                                   │
    │  ✓ /todos                                  │
    │  ✓ /shortcuts                              │
    └────────────────────────────────────────────┘
```

## Decision Tree

```
                    START: User Login Attempt
                              │
                ┌─────────────▼─────────────┐
                │  Choose Gmail or GitHub?  │
                └──────────┬────────────────┘
                           │
                 ┌─────────▼─────────┐
                 │ OAUTH PROVIDER    │
                 │ Authenticates     │
                 └─────────┬─────────┘
                           │
                 ┌─────────▼─────────┐
                 │ /auth/callback    │
                 └─────────┬─────────┘
                           │
                    ┌──────▼──────┐
                    │ flow param? │
                    └─┬───────┬───┘
              ┌───────┘       └───────┐
         signup                     login
              │                       │
        ┌─────▼──────────┐    ┌──────▼─────────┐
        │ Setup Password │    │ Check Profile  │
        │ Page           │    └──────┬─────────┘
        └────────────────┘           │
                              ┌──────▼──────────┐
                              │ oauth_provider? │
                              └─┬────────────┬──┘
                           NULL  │           │ set
                                 │           │
                            ┌────▼────┐  ┌──▼──────────┐
                            │ BLOCKED  │  │ password_   │
                            │ Unauth   │  │ set=true?   │
                            └──────────┘  └─┬────────┬──┘
                                        │false    │true
                                        │         │
                                  ┌─────▼──┐  ┌──▼───┐
                                  │ Setup  │  │ ✅OK  │
                                  │ Pass   │  │→Dash │
                                  └────────┘  └──────┘
```

## User Account States

```
┌────────────────────────────────────────────────────┐
│        OAUTH SIGNUP USER STATES                    │
└────────────────────────────────────────────────────┘

STATE 1: Just Authenticated with Gmail/GitHub
┌────────────────────────────────────┐
│ oauth_provider: 'google'           │
│ password_set: false                │
│ last_password_change: NULL         │
│                                    │
│ LOCATION: /auth/setup-password     │
│ ACTION: Must set password          │
│ DASHBOARD: ❌ BLOCKED              │
└────────────────────────────────────┘
           │
           └─ User sets password & username
           │
           ▼

STATE 2: Password Setup Complete
┌────────────────────────────────────┐
│ oauth_provider: 'google'           │
│ password_set: true                 │
│ last_password_change: [timestamp]  │
│                                    │
│ LOCATION: /dashboard               │
│ ACTION: Can access all features    │
│ DASHBOARD: ✅ ALLOWED              │
└────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│     EMAIL/PASSWORD USER STATES (BLOCKED)           │
└────────────────────────────────────────────────────┘

LEGACY STATE: Email/Password Only
┌────────────────────────────────────┐
│ oauth_provider: NULL               │
│ password_set: true                 │
│ last_password_change: [timestamp]  │
│                                    │
│ LOCATION: /auth/unauthorized       │
│ REASON: Not a Gmail/GitHub account │
│ DASHBOARD: ❌ BLOCKED              │
│                                    │
│ FIX: Must sign up with Gmail/      │
│     GitHub account                 │
└────────────────────────────────────┘
```

## Redirect Map

```
SUCCESSFUL FLOWS:
    Gmail Signup → Setup Password → Dashboard ✅
    GitHub Signup → Setup Password → Dashboard ✅
    Gmail Login (existing) → Dashboard ✅
    GitHub Login (existing) → Dashboard ✅

BLOCKED FLOWS:
    Unregistered Gmail → Setup Password (first time)
                      OR Unauthorized (if incomplete)
    Unregistered GitHub → Setup Password (first time)
                       OR Unauthorized (if incomplete)
    Email/Password User → Unauthorized (blocked)
    No Session → Login Page
    Incomplete Setup → Setup Password Page

REDIRECT DECISIONS:
    ┌─────────────────┬─────────────────────────┐
    │ Condition       │ Redirect To             │
    ├─────────────────┼─────────────────────────┤
    │ No user session │ /auth/login             │
    │ oauth = NULL    │ /auth/unauthorized      │
    │ password = false│ /auth/setup-password    │
    │ All good        │ /dashboard              │
    └─────────────────┴─────────────────────────┘
```

## Security Checkpoints

```
     LOGIN FLOW
        │
    Step 1: OAuth Provider
    ┌──▼──────────────┐
    │ User Auth OK?   │──NO──→ Back to Login
    └──┬───────────────┘
       │ YES
       │
    Step 2: Callback Route
    ┌──▼──────────────────────┐
    │ Code valid?             │──NO──→ Back to Login
    └──┬───────────────────────┘
       │ YES
       │
    Step 3: Session Created?
    ┌──▼──────────────────────┐
    │ User session active?    │──NO──→ Back to Login
    └──┬───────────────────────┘
       │ YES
       │
    Step 4: Database Check
    ┌──▼──────────────────────┐
    │ oauth_provider set?     │──NO──→ Unauthorized
    └──┬───────────────────────┘
       │ YES
       │
    Step 5: Password Check
    ┌──▼──────────────────────┐
    │ password_set = true?    │──NO──→ Setup Password
    └──┬───────────────────────┘
       │ YES
       │
    Step 6: Middleware Check (on dashboard)
    ┌──▼──────────────────────┐
    │ All checks still pass?   │──NO──→ Redirect based on failure
    └──┬───────────────────────┘
       │ YES
       │
    ✅ DASHBOARD ACCESS GRANTED
```

## Real-World Scenarios

### Scenario 1: Hacker Tries Direct Access
```
Hacker: Try to access /dashboard directly
  ↓
Middleware: Check user session
  ↓
❌ No session found
  ↓
Redirect: /auth/login
  ↓
Hacker must: Use Gmail/GitHub or Email/Password
  ↓
If Email/Password: oauth_provider = NULL
  ↓
❌ Redirected to /auth/unauthorized
```

### Scenario 2: User Creates Account Wrong Way
```
User: Tries to sign up with Email/Password (old method)
  ↓
Profile: oauth_provider = NULL, password_set = true
  ↓
User: Later tries to access /dashboard
  ↓
Middleware: Checks oauth_provider
  ↓
❌ NULL value found
  ↓
Redirect: /auth/unauthorized
  ↓
Message: "Must sign up with Gmail or GitHub"
```

### Scenario 3: Incomplete OAuth Signup
```
User: Clicks Gmail button
  ↓
Authenticates: Successfully
  ↓
Callback: flow=signup detected
  ↓
Redirect: /auth/setup-password
  ↓
User: Tries to access /dashboard WITHOUT setting password
  ↓
Middleware: Checks password_set = false
  ↓
Redirect: /auth/setup-password again
  ↓
User must: Complete password setup first
```

### Scenario 4: Valid User Login
```
User: Clicks Gmail on /auth/login
  ↓
Authenticates: Successfully
  ↓
Callback: flow is undefined (login, not signup)
  ↓
Database: Check oauth_provider = 'google' ✓
  ↓
Database: Check password_set = true ✓
  ↓
Redirect: /dashboard ✅
  ↓
Middleware: All checks pass ✓
  ↓
✅ Dashboard displayed
```

---

This comprehensive visual guide shows how the three-level verification system protects your application! 🔐
