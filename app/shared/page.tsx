import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserDbInfo } from "@/lib/supabase/user-helper"
import SharedClient from "./shared-client"

export default async function SharedPage() {
  const { userId } = await auth()
  const clerkUser = await currentUser()

  if (!userId) {
    redirect("/auth/login")
  }

  const email = clerkUser?.primaryEmailAddress?.emailAddress || null
  const dbInfo = await getUserDbInfo(userId, email)

  return <SharedClient userId={dbInfo.uuid} />
}
