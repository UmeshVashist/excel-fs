import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { checkOAuthUser } from "@/lib/supabase/oauth-middleware"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  // Verify user is authenticated with OAuth (Gmail or GitHub)
  const { user } = await checkOAuthUser()

  const supabase = await createClient()

  // Fetching initial counts for all categories
  const [formulasRes, shortcutsRes, notesRes, urlsRes, todosRes, sharedRes] = await Promise.all([
    supabase.from("formulas").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("shortcuts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("urls").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("todos").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("shared_items").select("*", { count: "exact", head: true }).eq("shared_with_id", user.id),
  ])

  return (
    <div className="space-y-8">
      <DashboardClient
        initialFormulasCount={formulasRes.count || 0}
        initialShortcutsCount={shortcutsRes.count || 0}
        initialNotesCount={notesRes.count || 0}
        initialUrlsCount={urlsRes.count || 0}
        initialTodosCount={todosRes.count || 0}
        initialSharedCount={sharedRes.count || 0}
        userId={user.id}
      />
    </div>
  )
}
