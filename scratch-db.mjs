import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://lzfksqzuiavlwrnteykt.supabase.co"
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmtzcXp1aWF2bHdybnRleWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEwMTMzOSwiZXhwIjoyMDgyNjc3MzM5fQ.i-wf4GvnfqUyMGKIFudYjGpJ1QOUg0C8A9-Zo5HUwGw"

const supabase = createClient(supabaseUrl, serviceKey)

function isValidUUID(val) {
  if (!val) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
}

async function testUserDbInfo(clerkUserId, email) {
  let { data: profilesByClerk } = await supabase
    .from("profiles")
    .select("id, clerk_user_id, email")
    .eq("clerk_user_id", clerkUserId)

  let matchingProfile = profilesByClerk?.[0]

  if (!matchingProfile && email) {
    const { data: profilesByEmail } = await supabase
      .from("profiles")
      .select("id, clerk_user_id, email")
      .eq("email", email)

    matchingProfile = profilesByEmail?.[0]
  }

  const profileUuid = matchingProfile?.id || (isValidUUID(clerkUserId) ? clerkUserId : "mock-uuid")
  const userIds = Array.from(new Set([clerkUserId, profileUuid].filter(Boolean)))
  const validUuids = userIds.filter(isValidUUID)

  console.log("clerkUserId:", clerkUserId)
  console.log("profileUuid:", profileUuid)
  console.log("userIds:", userIds)
  console.log("validUuids:", validUuids)

  const { data: sharedItems, error: sharedError } = await supabase
    .from("shared_items")
    .select("resource_id, resource_type, permission, created_at, owner_id")
    .in("shared_with_id", validUuids)

  console.log("Query .in('shared_with_id', validUuids) result:", sharedItems, sharedError || "")

  const { data: sharedItemsAll } = await supabase
    .from("shared_items")
    .select("resource_id, resource_type, permission, created_at, owner_id")
    .or(`shared_with_id.in.(${validUuids.join(",")}),clerk_user_id.in.(${userIds.filter(id => !isValidUUID(id)).join(",")})`)

  console.log("Query with OR (clerk_user_id) result:", sharedItemsAll)
}

testUserDbInfo("user_3FxJM7P318YR7fpLom9VufrsUh9", "us781819@gmail.com")
