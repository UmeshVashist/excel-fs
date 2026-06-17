import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NotesClient } from "./notes-client"
import { Suspense } from "react"
import { LoadingIcon } from "@/components/loading-icon"

export default async function NotesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  return (
    <Suspense fallback={<LoadingIcon />}>
      <NotesClient initialNotes={notes || []} userId={user.id} user={user} />
    </Suspense>
  )
}
