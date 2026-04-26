"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function loginAction(identifier: string, password: string) {
  const supabase = await createClient()

  // First, try to login with email
  let loginResult = await supabase.auth.signInWithPassword({
    email: identifier,
    password,
  })

  // If email login fails, try to find user by username in profiles table
  if (loginResult.error) {
    // Use service role client to bypass RLS for username lookup
    const serviceClient = createServiceRoleClient()
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("email")
      .ilike("username", identifier)
      .maybeSingle()

    if (profile?.email) {
      loginResult = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      })
    }
  }

  if (loginResult.error) {
    return { error: loginResult.error.message }
  }

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
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
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
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { url: data?.url }
}
