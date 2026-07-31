import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { getUserDbInfo } from "@/lib/supabase/user-helper"
import { FormulasClient } from "./formulas-client"
import { Suspense } from "react"
import { LoadingIcon } from "@/components/loading-icon"

export default async function FormulasPage() {
  const { userId } = await auth()
  const clerkUser = await currentUser()

  if (!userId) {
    redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "https://devtech.cashms.in/auth/login")
  }

  const email = clerkUser?.primaryEmailAddress?.emailAddress || null
  const dbInfo = await getUserDbInfo(userId, email)

  const supabase = await createClient()

  const { data: formulas } = await supabase
    .from("formulas")
    .select("*")
    .in("user_id", dbInfo.userIds)
    .neq("is_deleted", true)
    .order("created_at", { ascending: false })

  const user = clerkUser
    ? {
        id: dbInfo.uuid,
        clerk_user_id: userId,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        user_metadata: {
          username:
            clerkUser.username ||
            clerkUser.firstName ||
            clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
            "User",
        },
      }
    : { id: dbInfo.uuid, clerk_user_id: userId, email: null, user_metadata: {} }

  return (
    <Suspense fallback={<LoadingIcon />}>
      <FormulasClient initialFormulas={formulas || []} userId={dbInfo.uuid} userIds={dbInfo.userIds} user={user} />
    </Suspense>
  )

}
