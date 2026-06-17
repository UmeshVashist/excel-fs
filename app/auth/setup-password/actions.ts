"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function setupPassword(
  password: string,
  username: string
) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "You must be logged in to set up your password" }
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
      data: {
        username: username,
      },
    })

    if (updateError) {
      return { error: updateError.message }
    }

    // Update profile with username and mark password as set
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        username: username,
        password_set: true,
        last_password_change: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (profileError) {
      return { error: profileError.message }
    }

    return { success: true }
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "An error occurred",
    }
  }
}
