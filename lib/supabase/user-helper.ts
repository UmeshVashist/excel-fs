import { createClient } from "./server"

export interface UserDbInfo {
  clerkUserId: string
  uuid: string
  userIds: string[]
}

function isValidUUID(val?: string | null): boolean {
  if (!val) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
}

export async function getUserDbInfo(clerkUserId: string, email?: string | null): Promise<UserDbInfo> {
  const supabase = await createClient()

  // 1. Search profiles by clerk_user_id
  let { data: profilesByClerk } = await supabase
    .from("profiles")
    .select("id, clerk_user_id, email")
    .eq("clerk_user_id", clerkUserId)

  let matchingProfile = profilesByClerk?.[0]

  // 2. If not found by clerk_user_id, search by email (existing accounts)
  if (!matchingProfile && email) {
    const { data: profilesByEmail } = await supabase
      .from("profiles")
      .select("id, clerk_user_id, email")
      .eq("email", email)

    matchingProfile = profilesByEmail?.[0]

    // Link clerk_user_id to existing profile
    if (matchingProfile) {
      await supabase
        .from("profiles")
        .update({ clerk_user_id: clerkUserId, updated_at: new Date().toISOString() })
        .eq("id", matchingProfile.id)
    }
  }

  // 3. If profile still not found, create new profile with valid UUID and clerk_user_id
  if (!matchingProfile) {
    const newUuid = crypto.randomUUID()
    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        id: newUuid,
        clerk_user_id: clerkUserId,
        email: email || null,
        username: email ? email.split("@")[0] : "User",
        updated_at: new Date().toISOString(),
      })
      .select("id, clerk_user_id, email")
      .single()

    if (newProfile) {
      matchingProfile = newProfile
    } else if (error) {
      console.error("[v0] Error creating user profile:", error)
    }
  }

  const profileUuid = matchingProfile?.id || (isValidUUID(clerkUserId) ? clerkUserId : crypto.randomUUID())
  const userIds = Array.from(new Set([clerkUserId, profileUuid].filter(Boolean)))

  return {
    clerkUserId,
    uuid: profileUuid,
    userIds,
  }
}

export async function fetchItemsForUser(
  supabase: any,
  table: string,
  userIds: string[],
  extraOptions?: { limit?: number; searchQuery?: string; favoriteFilter?: string }
) {
  const cleanUserIds = Array.from(new Set((userIds || []).filter(Boolean)))
  if (cleanUserIds.length === 0) return { data: [], error: null }

  try {
    let query = supabase
      .from(table)
      .select("*")
      .in("user_id", cleanUserIds)
      .neq("is_deleted", true)
      .order("created_at", { ascending: false })

    const cleanQuery = extraOptions?.searchQuery?.trim().replace(/[^a-zA-Z0-9 _-]/g, "") || ""
    if (cleanQuery) {
      if (table === "urls") {
        query = query.or(`title.ilike.*${cleanQuery}*,description.ilike.*${cleanQuery}*,url.ilike.*${cleanQuery}*`)
      } else {
        query = query.or(`title.ilike.*${cleanQuery}*,description.ilike.*${cleanQuery}*`)
      }
    }

    if (extraOptions?.favoriteFilter === "favorites") query = query.eq("is_favorite", true)
    else if (extraOptions?.favoriteFilter === "unfavorites") query = query.eq("is_favorite", false)

    if (extraOptions?.limit) query = query.limit(extraOptions.limit)

    const { data, error } = await query
    return { data: data || [], error }
  } catch (err) {
    return { data: [], error: err }
  }
}

export async function countItemsForUser(supabase: any, table: string, userIds: string[]): Promise<number> {
  const cleanUserIds = Array.from(new Set((userIds || []).filter(Boolean)))
  if (cleanUserIds.length === 0) return 0

  try {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .in("user_id", cleanUserIds)
      .neq("is_deleted", true)

    return count || 0
  } catch (err) {
    return 0
  }
}



