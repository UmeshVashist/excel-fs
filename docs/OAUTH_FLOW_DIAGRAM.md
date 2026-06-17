# OAuth Signup Flow - Visual Guide

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      USER VISITS SIGNUP PAGE                                │
│                   /auth/sign-up                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
        ┌───────────▼────────┐  ┌──▼──────────┐  ┌─▼──────────────┐
        │   CLICK GMAIL      │  │CLICK GITHUB │  │ EMAIL/PASSWORD │
        │     BUTTON         │  │   BUTTON    │  │     FORM       │
        └───────────┬────────┘  └──┬──────────┘  └─┬──────────────┘
                    │               │              │
    ┌───────────────▼────┐  ┌──────▼────────┐     │
    │  GOOGLE LOGIN PAGE │  │GITHUB LOGIN   │     │
    │  User enters Gmail │  │ PAGE          │     │
    │  credentials       │  │ User enters   │     │
    └───────────┬────────┘  │ GitHub        │     │
                │            │ credentials   │     │
    ┌───────────▼───────┐  └──┬─────────────┘     │
    │  GOOGLE CONFIRMS  │     │                   │
    │   Identity        │  ┌──▼──────────────┐    │
    │   (May ask for    │  │  GITHUB         │    │
    │    2FA)           │  │  CONFIRMS       │    │
    │                   │  │  IDENTITY       │    │
    └───────────┬───────┘  └──┬──────────────┘    │
                │             │                    │
    ┌───────────▼─────────────▼──────────────┐    │
    │   REDIRECTS TO CALLBACK WITH CODE      │    │
    │  /auth/callback?code=XXX&flow=signup   │    │
    └───────────┬──────────────────────────┬─┘    │
                │                          │      │
    ┌───────────▼────────────────────┐ ┌──▼──────▼────────────┐
    │  EXCHANGE CODE FOR SESSION     │ │  SIGNUP SUBMISSION   │
    │  Create auth.users record      │ │  Create auth.users   │
    │  Trigger creates profile       │ │  Trigger creates     │
    │  oauth_provider set            │ │  profile             │
    └───────────┬────────────────────┘ │  password_set=true   │
                │                      └──┬───────────────────┘
    ┌───────────▼──────────────────────────▼──────────────────────┐
    │           REDIRECT TO NEXT PAGE                             │
    │  OAuth: /auth/setup-password?flow=signup                    │
    │  Email: /auth/sign-up-success                               │
    └───────────┬─────────────────────────────────────────────────┘
                │
    ┌───────────▼─────────────────────────────────────────────────┐
    │        PASSWORD SETUP PAGE                                  │
    │  ✓ Username input field                                     │
    │  ✓ Password input field                                     │
    │  ✓ Confirm password field                                   │
    │  ✓ Setup button                                             │
    └───────────┬─────────────────────────────────────────────────┘
                │
    ┌───────────▼─────────────────────────────────────────────────┐
    │        USER ENTERS CREDENTIALS                              │
    │  • Username: chosen by user                                 │
    │  • Password: created by user (min 6 chars)                  │
    │  • Confirm: verify password                                 │
    └───────────┬─────────────────────────────────────────────────┘
                │
    ┌───────────▼─────────────────────────────────────────────────┐
    │        CLICK "COMPLETE SETUP"                               │
    │  • Validate form                                            │
    │  • Check username is unique                                 │
    │  • Check password requirements                              │
    └───────────┬─────────────────────────────────────────────────┘
                │
    ┌───────────▼─────────────────────────────────────────────────┐
    │  SERVER-SIDE PROCESSING                                     │
    │  ✓ Update user password in auth.users                       │
    │  ✓ Update profile with username                             │
    │  ✓ Set password_set = true                                  │
    │  ✓ Update last_password_change timestamp                    │
    └───────────┬─────────────────────────────────────────────────┘
                │
    ┌───────────▼─────────────────────────────────────────────────┐
    │        REDIRECT TO DASHBOARD                                │
    │  /dashboard                                                 │
    │  ✓ User is authenticated                                    │
    │  ✓ Session is active                                        │
    │  ✓ Ready to use app                                         │
    └─────────────────────────────────────────────────────────────┘
```

## Database State at Each Step

### After Gmail/GitHub Authentication
```
auth.users table:
├─ id: xxxxx
├─ email: user@gmail.com
├─ raw_app_meta_data: { provider: "google" }
└─ created_at: 2024-04-22

profiles table:
├─ id: xxxxx
├─ email: user@gmail.com
├─ username: (auto-generated or null)
├─ oauth_provider: "google"
├─ password_set: false          ← User hasn't set password yet
├─ oauth_signup_date: 2024-04-22
└─ created_at: 2024-04-22
```

### After Password Setup Completion
```
auth.users table:
├─ id: xxxxx
├─ email: user@gmail.com
├─ encrypted_password: $2a$...  ← Now has password!
├─ raw_app_meta_data: { provider: "google" }
└─ updated_at: 2024-04-22

profiles table:
├─ id: xxxxx
├─ email: user@gmail.com
├─ username: "john_doe"         ← User-chosen username
├─ oauth_provider: "google"
├─ password_set: true           ← Now password is set!
├─ last_password_change: 2024-04-22
└─ updated_at: 2024-04-22
```

## API Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT SIDE                                  │
│                  (Browser / React)                               │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────────┐
                │  signUpWithGmail() call   │
                │  /auth/sign-up/actions.ts│
                └─────────┬─────────────────┘
                          │
                          ▼
                ┌───────────────────────────────────┐
                │  Supabase OAuth URL generated     │
                │  ?redirectTo=/auth/callback?...   │
                └─────────┬───────────────────────┘
                          │
        ┌─────────────────▼──────────────────┐
        │   OAuth Provider                   │
        │   (Google / GitHub)                │
        │   ↓ User authenticates ↓           │
        │   ↓ Provider validates ↓           │
        │   ↓ Sends code back ↓              │
        └─────────────────┬──────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │  Browser redirected to:                 │
        │  /auth/callback?                        │
        │    code=...&                            │
        │    flow=signup                          │
        └─────────────┬───────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────────┐
        │  /auth/callback/route.ts (Server)       │
        │  ✓ Receive code                         │
        │  ✓ Exchange code for session            │
        │  ✓ Read flow parameter                  │
        └─────────────┬───────────────────────────┘
                      │
        ┌─────────────▼──────────────────┐
        │  Flow === "signup"?            │
        ├─────────────┬──────────────────┤
        │   YES       │      NO          │
        │             │                  │
        ▼             ▼                  ▼
    /auth/      /dashboard         (login flow)
    setup-      (already has
    password    password)
```

## State Machine Diagram

```
                    ┌────────────────────────┐
                    │   NOT AUTHENTICATED    │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼──────────┐
                    │  Click OAuth Button   │
                    │  on /auth/sign-up    │
                    └────────────┬──────────┘
                                 │
                    ┌────────────▼──────────────────┐
                    │  AUTHENTICATING WITH          │
                    │  PROVIDER (GOOGLE/GITHUB)     │
                    └────────────┬──────────────────┘
                                 │
                    ┌────────────▼────────────────┐
                    │  AUTHENTICATED BUT          │
                    │  PASSWORD NOT SET           │
                    └────────────┬─────────────────┘
                                 │
                    ┌────────────▼─────────────────┐
                    │  AT SETUP-PASSWORD PAGE     │
                    │  User enters credentials     │
                    └────────────┬─────────────────┘
                                 │
                    ┌────────────▼─────────────────┐
                    │  PROCESSING PASSWORD SETUP   │
                    │  (Server validation)         │
                    └────────────┬─────────────────┘
                                 │
                    ┌────────────▼──────────────────┐
                    │  FULLY AUTHENTICATED &        │
                    │  SETUP COMPLETE              │
                    │  Can now access dashboard    │
                    └──────────────────────────────┘
```

## Component Architecture

```
pages/
├── auth/
│   ├── sign-up/
│   │   ├── page.tsx               ← Signup UI
│   │   └── actions.ts             ← OAuth functions
│   │       ├── signUpWithGmail()
│   │       ├── signUpWithGithub()
│   │       └── signUpWithEmail()
│   │
│   ├── setup-password/
│   │   ├── page.tsx               ← Password setup UI
│   │   └── actions.ts             ← Password update
│   │       └── setupPassword()
│   │
│   ├── callback/
│   │   └── route.ts               ← OAuth callback
│   │       ├── Exchange code
│   │       ├── Check flow param
│   │       └── Route accordingly
│   │
│   └── login/
│       ├── page.tsx               ← Login UI
│       └── actions.ts             ← Login functions
│
lib/
├── supabase/
│   ├── client.ts                  ← Client init
│   └── server.ts                  ← Server init
│
components/
├── ui/
│   ├── button.tsx
│   ├── input.tsx
│   └── card.tsx
```

## Data Flow

```
User Input
    │
    ▼
Client Components (React)
    │
    ├─→ Client-side Validation
    │    ├─ Username format
    │    ├─ Password strength
    │    └─ Email format
    │
    ▼
Server Actions (TypeScript)
    │
    ├─→ Additional Validation
    │    ├─ Unique username check
    │    ├─ Password requirements
    │    └─ Business logic
    │
    ▼
Supabase API
    │
    ├─→ OAuth Token Exchange
    ├─→ Password Encryption
    ├─→ Database Trigger
    │    └─ Auto-create profile
    │
    ▼
Database (PostgreSQL)
    │
    ├─→ auth.users table
    │    └─ User authentication
    │
    ├─→ public.profiles table
    │    └─ User metadata
    │
    ▼
Response sent to client
    │
    ▼
Redirect to Dashboard/Success Page
```

## Error Handling Flow

```
User Action
    │
    ├─→ Client Validation Fails?
    │    └─→ Show inline error message
    │
    ├─→ OAuth Provider Fails?
    │    └─→ Redirect to /auth/login?error=...
    │
    ├─→ Code Exchange Fails?
    │    └─→ Redirect to /auth/login?error=...
    │
    ├─→ Server Validation Fails?
    │    └─→ Return error to UI
    │    └─→ Display error message
    │
    ├─→ Database Operation Fails?
    │    └─→ Return error to UI
    │    └─→ Display error message
    │    └─→ Suggest retry
    │
    ▼
Success or User-Friendly Error Message
```

## Query Parameter Flow

```
Initial Signup Click
    │
    ▼
OAuth Provider Sent This:
└─→ https://yourapp.com/auth/callback?
    ├─ code=abc123...          ← Authorization code
    ├─ state=xyz...            ← CSRF token
    └─ session_state=...       ← Provider state
                │
                └─→ YOUR callback/route.ts adds:
                    └─→ flow=signup
                        (for signup redirects)
                │
                ▼
    Final URL:
    /auth/callback?code=abc123&state=xyz&flow=signup
                    │
                    ├─→ Exchange code → session
                    ├─→ Read flow parameter
                    └─→ Route to /auth/setup-password

Traditional Login Path:
    /auth/callback?code=abc123&state=xyz
    (NO flow parameter)
                    │
                    ├─→ Exchange code → session
                    └─→ Route to /dashboard
```

---

This visual guide shows how all the pieces fit together in your OAuth signup system!
