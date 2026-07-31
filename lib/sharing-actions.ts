"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { auth } from "@clerk/nextjs/server"

export async function searchUsers(query: string) {
  const supabase = createServiceRoleClient() // Use service role to search all profiles
  const clean = query.trim().replace(/[*%]/g, "")

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, email")
    .or(`username.ilike.*${clean}*,email.ilike.*${clean}*`)
    .limit(5)


  if (error) {
    console.error("Search users error:", error)
    return { error: error.message }
  }

  return { profiles: profiles || [] }
}

export async function shareItem(params: {
  resourceId: string
  resourceType: string
  ownerId: string
  userIds: string[]
  permission: "view" | "edit"
}) {
  const supabase = createServiceRoleClient()

  const shares = params.userIds.map((userId) => ({
    owner_id: params.ownerId,
    shared_with_id: userId,
    resource_id: params.resourceId,
    resource_type: params.resourceType,
    permission: params.permission,
  }))

  const { error } = await supabase
    .from("shared_items")
    .upsert(shares, { onConflict: "shared_with_id,resource_id,resource_type" })

  if (error) {
    console.error("Share item error:", error)
    return { error: error.message }
  }

  // Log history
  await logHistory({
    resourceId: params.resourceId,
    resourceType: params.resourceType,
    action: "shared",
    newValue: `Shared with ${params.userIds.length} users with ${params.permission} permission`,
    userId: params.ownerId,
  })

  return { success: true }
}

export async function updateSharePermission(shareId: string, permission: "view" | "edit") {
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from("shared_items").update({ permission }).eq("id", shareId)

  if (error) {
    console.error("Update share permission error:", error)
    return { error: error.message }
  }

  return { success: true }
}

export async function removeShare(shareId: string) {
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from("shared_items").delete().eq("id", shareId)

  if (error) {
    console.error("Remove share error:", error)
    return { error: error.message }
  }

  return { success: true }
}

export async function logHistory(params: {
  resourceId: string
  resourceType: string
  action: string
  fieldName?: string
  oldValue?: string
  newValue?: string
  userId?: string // Optional override
}) {
  try {
    const supabase = createServiceRoleClient()
    let finalUserId = params.userId

    if (!finalUserId) {
      try {
        const { userId: clerkId } = await auth()
        if (clerkId) {
          finalUserId = clerkId
        }
      } catch {
        // Not in request context
      }
    }

    if (!finalUserId) {
      console.warn("Log history skipped: No user ID found")
      return
    }

    // Resolve profile for item_history table
    let dbUserId = finalUserId
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalUserId)

    if (!isUUID) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_user_id", finalUserId)
        .maybeSingle()

      if (profile?.id) {
        dbUserId = profile.id
      }
    }

    const { error } = await supabase.from("item_history").insert({
      resource_id: params.resourceId,
      resource_type: params.resourceType,
      user_id: dbUserId,
      action: params.action,
      field_name: params.fieldName,
      old_value: params.oldValue,
      new_value: params.newValue,
    })

    if (error) {
      console.error("Log history database error:", error)
    }
  } catch (e) {
    console.error("Log history exception:", e)
  }
}

export async function getSharedWith(resourceId: string, resourceType: string) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("shared_items")
    .select(`
      id,
      created_at,
      permission,
      profiles!shared_with_id (
        username,
        email
      )
    `)
    .eq("resource_id", resourceId)
    .eq("resource_type", resourceType)

  if (error) {
    console.error("Get shared with error:", error)
    return []
  }

  // Map the join result to a flatter structure
  return (data || []).map((item) => ({
    ...item,
    profiles: (item as any).profiles,
  }))
}

export async function getBatchSharedWith(resourceIds: string[], resourceType: string) {
  if (!resourceIds.length) return {}

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("shared_items")
    .select(`
      id,
      resource_id,
      created_at,
      permission,
      profiles!shared_with_id (
        username,
        email
      )
    `)
    .in("resource_id", resourceIds)
    .eq("resource_type", resourceType)

  if (error) {
    console.error("Get batch shared with error:", error)
    return {}
  }

  // Group by resource_id
  const result: Record<string, any[]> = {}
  data?.forEach((item) => {
    if (!result[item.resource_id]) {
      result[item.resource_id] = []
    }
    result[item.resource_id].push({
      ...item,
      profiles: (item as any).profiles,
    })
  })

  return result
}

export async function getItemHistory(resourceId: string, resourceType: string) {
  const supabase = createServiceRoleClient()

  const { data: historyData, error } = await supabase
    .from("item_history")
    .select("*")
    .eq("resource_id", resourceId)
    .eq("resource_type", resourceType)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Get item history error:", error)
    return []
  }

  if (!historyData || historyData.length === 0) return []

  // Fetch profiles for all user_ids in history
  const userIds = Array.from(new Set(historyData.map((h) => h.user_id).filter(Boolean)))

  let profileMap: Record<string, { username: string; email: string }> = {}
  if (userIds.length > 0) {
    const uuidList = userIds.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    const textList = userIds.filter((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))

    const filters: string[] = []
    if (uuidList.length) filters.push(`id.in.(${uuidList.map((id) => `"${id}"`).join(",")})`)
    if (textList.length) filters.push(`clerk_user_id.in.(${textList.map((id) => `"${id}"`).join(",")})`)

    if (filters.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, clerk_user_id, username, email")
        .or(filters.join(","))

      profiles?.forEach((p) => {
        if (p.id) profileMap[p.id] = { username: p.username, email: p.email }
        if (p.clerk_user_id) profileMap[p.clerk_user_id] = { username: p.username, email: p.email }
      })
    }
  }

  return historyData.map((item) => ({
    ...item,
    profiles: profileMap[item.user_id] || { username: "User", email: "" },
  }))
}
