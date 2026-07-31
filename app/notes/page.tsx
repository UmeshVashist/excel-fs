import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { getUserDbInfo, fetchItemsForUser } from "@/lib/supabase/user-helper"
import { NotesClient } from "./notes-client"
import { Suspense } from "react"
import { LoadingIcon } from "@/components/loading-icon"

export default async function NotesPage() {
  const { userId } = await auth()
  const clerkUser = await currentUser()

  if (!userId) {
    redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "https://devtech.cashms.in/auth/login")
  }

  const email = clerkUser?.primaryEmailAddress?.emailAddress || null
  const dbInfo = await getUserDbInfo(userId, email)

  const supabase = await createClient()

  const { data: notes } = await fetchItemsForUser(supabase, "notes", dbInfo.userIds)


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
      <NotesClient initialNotes={notes || []} userId={dbInfo.uuid} userIds={dbInfo.userIds} user={user} />
    </Suspense>
  )

}
