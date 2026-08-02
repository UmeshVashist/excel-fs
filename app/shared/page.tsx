import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserDbInfo } from "@/lib/supabase/user-helper"
import { getSharedItemsAction } from "@/lib/item-actions"
import SharedClient from "./shared-client"

export default async function SharedPage() {
  const { userId } = await auth()
  const clerkUser = await currentUser()

  if (!userId) {
    redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "https://devtech.cashms.in/auth/login")
  }

  const email = clerkUser?.primaryEmailAddress?.emailAddress || null
  const dbInfo = await getUserDbInfo(userId, email)
  const sharedRes = await getSharedItemsAction()

  return (
    <SharedClient
      userId={dbInfo.uuid}
      userIds={dbInfo.userIds}
      initialItems={sharedRes.data || { formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} }}
    />
  )
}
