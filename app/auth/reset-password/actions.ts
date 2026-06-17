"use server"

import { createClient } from "@/lib/supabase/server"

export async function updatePasswordAction(newPassword: string) {
  const supabase = await createClient()

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    return { error: updateError.message }
  }

  // Update the profile's last_password_change timestamp
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    await supabase.from("profiles").update({ last_password_change: new Date().toISOString() }).eq("id", user.id)
  }

  return { success: true }
}
