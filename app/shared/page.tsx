import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SharedClient from "./shared-client"

export default async function SharedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <SharedClient userId={user.id} />
}
