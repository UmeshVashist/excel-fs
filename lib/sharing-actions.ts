"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function searchUsers(query: string) {
  const supabase = createServiceRoleClient() // Use service role to search all profiles
  
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, email")
    .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
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
  const supabase = await createClient()
  
  const shares = params.userIds.map(userId => ({
    owner_id: params.ownerId,
    shared_with_id: userId,
    resource_id: params.resourceId,
    resource_type: params.resourceType,
    permission: params.permission
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
    newValue: `Shared with ${params.userIds.length} users with ${params.permission} permission`
  })

  return { success: true }
}

export async function updateSharePermission(shareId: string, permission: "view" | "edit") {
  const supabase = await createClient()
  const { error } = await supabase
    .from("shared_items")
    .update({ permission })
    .eq("id", shareId)

  if (error) {
    console.error("Update share permission error:", error)
    return { error: error.message }
  }

  return { success: true }
}

export async function removeShare(shareId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("shared_items")
    .delete()
    .eq("id", shareId)

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
      const standardSupabase = await createClient()
      const { data: { user } } = await standardSupabase.auth.getUser()
      if (user) {
        finalUserId = user.id
      }
    }

    if (!finalUserId) {
      console.warn("Log history skipped: No user ID found")
      return
    }

    const { error } = await supabase.from("item_history").insert({
      resource_id: params.resourceId,
      resource_type: params.resourceType,
      user_id: finalUserId,
      action: params.action,
      field_name: params.fieldName,
      old_value: params.oldValue,
      new_value: params.newValue
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
  return (data || []).map(item => ({
    ...item,
    profiles: (item as any).profiles
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
  data?.forEach(item => {
    if (!result[item.resource_id]) {
      result[item.resource_id] = []
    }
    result[item.resource_id].push({
      ...item,
      profiles: (item as any).profiles
    })
  })
  
  return result
}

export async function getItemHistory(resourceId: string, resourceType: string) {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from("item_history")
    .select(`
      id,
      action,
      field_name,
      old_value,
      new_value,
      created_at,
      profiles!user_id (
        username,
        email
      )
    `)
    .eq("resource_id", resourceId)
    .eq("resource_type", resourceType)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Get item history error:", error)
    return []
  }

  return (data || []).map(item => ({
    ...item,
    profiles: (item as any).profiles
  }))
}
