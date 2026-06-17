import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ShortcutsClient } from "./shortcuts-client"
import { Suspense } from "react"
import { LoadingIcon } from "@/components/loading-icon"

export default async function ShortcutsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: shortcuts } = await supabase
    .from("shortcuts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  return (
    <Suspense fallback={<LoadingIcon />}>
      <ShortcutsClient initialShortcuts={shortcuts || []} userId={user.id} user={user} />
    </Suspense>
  )
}
