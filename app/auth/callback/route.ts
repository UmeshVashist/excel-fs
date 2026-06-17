import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const error_description = searchParams.get("error_description")
  const flow = searchParams.get("flow") // "signup" or undefined for login

  // Handle error from OAuth provider
  if (error) {
    console.error("OAuth error:", error, error_description)
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(error_description || error)}`,
        request.url
      )
    )
  }

  // If there's no code, redirect to login
  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  const supabase = await createClient()

  // Exchange the code for a session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("Error exchanging code:", exchangeError)
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(exchangeError.message)}`,
        request.url
      )
    )
  }

  // Set last_activity cookie immediately upon successful OAuth exchange
  const cookieStore = await cookies()
  cookieStore.set("last_activity", Date.now().toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  })

  // Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // User should be authenticated by now
  if (!user) {
    console.error("User not authenticated after code exchange")
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Check if the user was just created (within the last 10 minutes)
  const isNewUser = (new Date().getTime() - new Date(user.created_at).getTime()) < 600000

  // If this is a login flow (not signup), and user is new, we now allow it 
  // but redirect to the setup page. This provides a better UX than blocking.
  if (flow !== "signup" && isNewUser) {
    console.log("New user logged in via OAuth, redirecting to setup:", user.id)
    // We'll proceed to profile checks below to ensure everything is set up
  }

  // Get user's profile with retry logic (triggers can be slow)
  let profile = null
  let retryCount = 0
  const maxRetries = 3

  while (retryCount < maxRetries) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("oauth_provider, password_set, email")
      .eq("id", user.id)
      .maybeSingle()

    if (data) {
      profile = data
      console.log("Profile found for user:", user.id)
      break
    }

    if (profileError) {
      console.error(`Profile fetch attempt ${retryCount + 1} error:`, profileError)
      // If the error is about missing columns, we should log that specifically
      if (profileError.code === "PGRST204" || profileError.message?.includes("column")) {
        console.error("DATABASE SCHEMA ERROR: Missing columns in public.profiles table. Please run the migration script 005_add_oauth_tracking.sql")
      }
    } else {
      console.log(`Profile fetch attempt ${retryCount + 1} returned no data, retrying...`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s
    retryCount++
  }

  if (!profile) {
    console.error("Profile not found for user after retries:", user.id)
    // If it's a signup flow OR a new user logging in, we can try to manually create a basic profile if trigger failed
    if (flow === "signup" || isNewUser) {
      console.log("Attempting manual profile creation for user:", user.id)
      try {
        const serviceClient = createServiceRoleClient()
        const { data: newProfile, error: createError } = await serviceClient
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            username: `user_${user.id.substring(0, 8)}`,
            oauth_provider: user.app_metadata.provider || null,
            password_set: false
          })
          .select()
          .single()
        
        if (createError) {
          console.error("Failed to manually create profile:", createError)
          
          // Even if insert fails, check if profile was created by trigger in the meantime
          // This handles race conditions where the trigger finally succeeds
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("oauth_provider, password_set, email")
            .eq("id", user.id)
            .maybeSingle()
          
          if (existingProfile) {
            console.log("Profile found on final check after manual creation failure")
            profile = existingProfile
          } else {
            console.error("Manual creation failed and profile still missing. Check database logs.")
            return NextResponse.redirect(new URL(`/auth/sign-up?error=${encodeURIComponent("Failed to initialize your profile. Please try again.")}`, request.url))
          }
        } else {
          console.log("Manually created profile successfully")
          profile = newProfile
        }
      } catch (e) {
        console.error("Exception during manual profile creation:", e)
        return NextResponse.redirect(new URL(`/auth/sign-up?error=${encodeURIComponent("Profile initialization error. Please contact support.")}`, request.url))
      }
    } else {
      console.warn("User profile not found for existing user login:", user.id)
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${encodeURIComponent("User account not found in database. Please sign up first.")}`,
          request.url
        )
      )
    }
  }

  // Ensure profiles table email is in sync with auth.users email
  // This is crucial for email changes where auth.users updates first
  if (user.email && profile.email !== user.email) {
    await supabase
      .from("profiles")
      .update({ email: user.email })
      .eq("id", user.id)
  }

  // Ensure oauth_provider is set if they just logged in via OAuth
  if (!profile.oauth_provider && user.app_metadata.provider) {
    await supabase
      .from("profiles")
      .update({ oauth_provider: user.app_metadata.provider })
      .eq("id", user.id)
    profile.oauth_provider = user.app_metadata.provider
  }

  // If this is a signup flow from OAuth, redirect to dashboard with new_user flag
  if (flow === "signup") {
    // If it's a new user or password hasn't been set, show the setup popup on dashboard
    if (isNewUser || !profile.password_set) {
      return NextResponse.redirect(new URL("/dashboard?new_user=true", request.url))
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // For login flow, verify user has OAuth provider registered
  if (!profile.oauth_provider) {
    console.warn("User logged in without OAuth provider record:", user.id)
    // If they have it in auth.users but not profiles, we just updated it above, 
    // so this branch should rarely be hit now.
    return NextResponse.redirect(new URL("/auth/unauthorized", request.url))
  }

  // Verify password has been set for OAuth users
  if (!profile.password_set) {
    console.warn("OAuth user hasn't set password yet:", user.id)
    return NextResponse.redirect(new URL("/dashboard?new_user=true", request.url))
  }

  // All checks passed - redirect to dashboard
  if (isNewUser || !profile.password_set) {
    return NextResponse.redirect(new URL("/dashboard?new_user=true", request.url))
  }
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
