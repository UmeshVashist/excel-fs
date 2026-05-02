"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { getURL } from "@/lib/utils"
import { cookies } from "next/headers"

export async function loginAction(identifier: string, password: string) {
  const supabase = await createClient()
  const cookieStore = await cookies()

  const isEmail = identifier.includes("@")
  let email = identifier.trim()

  // If it doesn't look like an email, try to find the email by username first
  if (!isEmail) {
    const serviceClient = createServiceRoleClient()
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("email")
      .ilike("username", identifier.trim())
      .maybeSingle()

    if (profile?.email) {
      email = profile.email
    } else {
      // Fallback: Check if the user accidentally entered an email that was recorded as a username
      // Or if the username lookup failed for some other reason
      console.error("Username lookup failed:", profileError)
    }
  }

  // Login with the resolved email or original identifier
  const loginResult = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // If the first attempt failed and we haven't tried the original identifier as email yet
  if (loginResult.error && !isEmail && email !== identifier.trim()) {
    const secondAttempt = await supabase.auth.signInWithPassword({
      email: identifier.trim(),
      password,
    })
    
    if (secondAttempt.error) {
      return { error: secondAttempt.error.message }
    }
    
    // If second attempt succeeded, update variables for subsequent logic
    loginResult.data = secondAttempt.data
    loginResult.error = null
  } else if (loginResult.error) {
    return { error: loginResult.error.message }
  }

  // Set last_activity cookie immediately upon successful login
  // This helps prevent the middleware redirect loop
  cookieStore.set("last_activity", Date.now().toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  })

  // Check for password expiration (90 days)
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_password_change")
    .eq("id", loginResult.data.user.id)
    .single()

  if (profile?.last_password_change) {
    const lastChange = new Date(profile.last_password_change)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    if (lastChange < ninetyDaysAgo) {
      return { passwordExpired: true }
    }
  }

  return { success: true }
}

export async function loginWithGmail() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getURL()}auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { url: data?.url }
}

export async function loginWithGithub() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${getURL()}auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { url: data?.url }
}
