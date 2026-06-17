import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LoadingIcon } from "@/components/loading-icon"
import { UrlsClient } from "./urls-client"

export default async function UrlsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: urls } = await supabase
    .from("urls")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  return (
    <Suspense fallback={<LoadingIcon />}>
      <UrlsClient initialUrls={urls || []} userId={user.id} user={user} />
    </Suspense>
  )
}
