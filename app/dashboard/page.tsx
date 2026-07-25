import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { getUserDbInfo } from "@/lib/supabase/user-helper"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const { userId } = await auth()
  const clerkUser = await currentUser()

  if (!userId) {
    redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "https://devtech.cashms.in/auth/login")
  }

  const email = clerkUser?.primaryEmailAddress?.emailAddress || null
  const dbInfo = await getUserDbInfo(userId, email)
  const filterOr = `user_id.eq.${dbInfo.uuid},clerk_user_id.eq.${dbInfo.clerkUserId}`

  const supabase = await createClient()

  // Fetching initial counts for all categories
  const [formulasRes, shortcutsRes, notesRes, urlsRes, todosRes, sharedItemsRes] = await Promise.all([
    supabase.from("formulas").select("*", { count: "exact", head: true }).or(filterOr).eq("is_deleted", false),
    supabase.from("shortcuts").select("*", { count: "exact", head: true }).or(filterOr).eq("is_deleted", false),
    supabase.from("notes").select("*", { count: "exact", head: true }).or(filterOr).eq("is_deleted", false),
    supabase.from("urls").select("*", { count: "exact", head: true }).or(filterOr).eq("is_deleted", false),
    supabase.from("todos").select("*", { count: "exact", head: true }).or(filterOr).eq("is_deleted", false),
    supabase.from("shared_items").select("resource_id, resource_type").or(`shared_with_id.eq.${dbInfo.uuid},shared_with_id.eq.${dbInfo.clerkUserId}`),
  ])

  // Calculate actual visible shared count by checking if resources are not deleted
  let initialSharedCount = 0
  if (sharedItemsRes.data && sharedItemsRes.data.length > 0) {
    const sharedItems = sharedItemsRes.data
    const typeGroups = sharedItems.reduce((acc: any, item) => {
      if (!acc[item.resource_type]) acc[item.resource_type] = []
      acc[item.resource_type].push(item.resource_id)
      return acc
    }, {})

    const visibleCounts = await Promise.all(
      Object.entries(typeGroups).map(async ([type, ids]: [any, any]) => {
        const table =
          type === "shortcuts"
            ? "shortcuts"
            : type === "formulas"
            ? "formulas"
            : type === "notes"
            ? "notes"
            : type === "urls"
            ? "urls"
            : "todos"
        const { count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .in("id", ids)
          .eq("is_deleted", false)
        return count || 0
      })
    )

    initialSharedCount = visibleCounts.reduce((sum, count) => sum + count, 0)
  }

  return (
    <div className="space-y-8">
      <DashboardClient
        initialFormulasCount={formulasRes.count || 0}
        initialShortcutsCount={shortcutsRes.count || 0}
        initialNotesCount={notesRes.count || 0}
        initialUrlsCount={urlsRes.count || 0}
        initialTodosCount={todosRes.count || 0}
        initialSharedCount={initialSharedCount}
        userId={dbInfo.uuid}
      />
    </div>
  )
}
