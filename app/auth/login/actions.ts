"use server"

import { createClient } from "@/lib/supabase/server"

export async function loginAction(identifier: string, password: string) {
  const supabase = await createClient()

  // First, try to login with email
  let loginResult = await supabase.auth.signInWithPassword({
    email: identifier,
    password,
  })

  // If email login fails, try to find user by username in profiles table
  if (loginResult.error) {
    const { data: profile } = await supabase.from("profiles").select("email").eq("username", identifier).single()

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
