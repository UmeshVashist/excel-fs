"use server"

import { createClient } from "@/lib/supabase/server"
import { getURL } from "@/lib/utils"

export async function signUpWithEmail(
  username: string,
  email: string,
  password: string
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getURL()}dashboard`,
        data: {
          username,
        },
      },
    })

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "An error occurred",
    }
  }
}

export async function signUpWithGmail() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getURL()}auth/callback?flow=signup`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })

    if (error) throw error

    return { url: data?.url }
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "OAuth signup failed",
    }
  }
}

export async function signUpWithGithub() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${getURL()}auth/callback?flow=signup`,
      },
    })

    if (error) throw error

    return { url: data?.url }
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "OAuth signup failed",
    }
  }
}
