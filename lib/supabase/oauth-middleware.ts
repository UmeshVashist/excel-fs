import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * Middleware to check if user is authenticated with OAuth (Gmail/GitHub)
 * Verifies:
 * 1. User is logged in
 * 2. User has a profile
 * 3. User has oauth_provider set (Google or GitHub)
 * 4. User has completed password setup
 * 
 * Returns user data if valid, redirects if not
 */
export async function checkOAuthUser() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ❌ Not authenticated at all
  if (!user) {
    console.warn("No authenticated user found")
    redirect("/auth/login")
  }

  // Get user's profile to verify OAuth setup
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("oauth_provider, password_set, email, username")
    .eq("id", user.id)
    .maybeSingle() // Use maybeSingle to avoid PGRST116 error

  // ❌ Profile not found in database
  if (!profile) {
    console.error("Profile not found for user:", user.id, error)
    // Sign out the user since they don't have a valid profile
    await supabase.auth.signOut()
    redirect("/auth/login?error=" + encodeURIComponent("User not found. Please sign up first."))
  }

  // ❌ User doesn't have Gmail or GitHub OAuth provider set
  if (!profile.oauth_provider) {
    console.warn("User doesn't have OAuth provider:", user.id)
    redirect("/auth/unauthorized")
  }

  // ✅ All checks passed (password_set is checked in components like SetupAccountPopup)
  return {
    user,
    profile,
  }
}

/**
 * Middleware to verify Gmail specifically
 * Only allows users with google OAuth provider
 */
export async function checkGmailUser() {
  const { user, profile } = await checkOAuthUser()

  if (profile.oauth_provider !== "google") {
    console.warn("User is not Gmail authenticated:", user.id, profile.oauth_provider)
    redirect("/auth/unauthorized")
  }

  return { user, profile }
}

/**
 * Middleware to verify GitHub specifically
 * Only allows users with github OAuth provider
 */
export async function checkGithubUser() {
  const { user, profile } = await checkOAuthUser()

  if (profile.oauth_provider !== "github") {
    console.warn("User is not GitHub authenticated:", user.id, profile.oauth_provider)
    redirect("/auth/unauthorized")
  }

  return { user, profile }
}

/**
 * Middleware to get any authenticated user (no OAuth requirement)
 * Used for pages that don't require OAuth
 */
export async function getAuthUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

