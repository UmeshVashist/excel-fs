import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TodosClient } from "./todos-client"

export default async function TodosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  return <TodosClient initialTodos={todos || []} userId={user.id} user={user} />
}
