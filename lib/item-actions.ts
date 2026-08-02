"use server"

import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserDbInfo, fetchItemsForUser, isValidUUID } from "@/lib/supabase/user-helper"
import { revalidatePath } from "next/cache"
import { logHistory } from "./sharing-actions"


export async function addItemAction(table: string, payload: any) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { error: "Unauthorized" }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress || null
    const dbInfo = await getUserDbInfo(clerkUserId, email)

    const supabase = createServiceRoleClient()

    const insertData: any = {
      ...payload,
      user_id: dbInfo.uuid,
      clerk_user_id: clerkUserId,
      is_deleted: false,
    }

    let { data, error } = await supabase.from(table).insert(insertData).select().single()

    if (error && (error.code === "PGRST204" || error.message.includes("clerk_user_id"))) {
      delete insertData.clerk_user_id
      const retry = await supabase.from(table).insert(insertData).select().single()
      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error(`Insert ${table} error:`, error)
      return { error: error.message }
    }

    await logHistory({
      resourceId: data.id,
      resourceType: table,
      action: "created",
      newValue: data.title || data.name || "Item",
      userId: dbInfo.uuid,
    })

    revalidatePath(`/${table}`)
    revalidatePath("/dashboard")
    return { success: true, data }
  } catch (err: any) {
    console.error(`addItemAction error on ${table}:`, err)
    return { error: err.message || "Failed to add item" }
  }
}

export async function updateItemAction(table: string, id: string, payload: any) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { error: "Unauthorized" }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress || null
    const dbInfo = await getUserDbInfo(clerkUserId, email)

    const supabase = createServiceRoleClient()

    const updateData = {
      ...payload,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from(table)
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error(`Update ${table} error:`, error)
      return { error: error.message }
    }

    await logHistory({
      resourceId: id,
      resourceType: table,
      action: "updated",
      newValue: data.title || data.name || "Item",
      userId: dbInfo.uuid,
    })

    revalidatePath(`/${table}`)
    revalidatePath("/dashboard")
    return { success: true, data }
  } catch (err: any) {
    console.error(`updateItemAction error on ${table}:`, err)
    return { error: err.message || "Failed to update item" }
  }
}

export async function deleteItemAction(table: string, id: string) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { error: "Unauthorized" }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress || null
    const dbInfo = await getUserDbInfo(clerkUserId, email)

    const supabase = createServiceRoleClient()

    // 1. Soft delete: move item to Recycle Bin
    const { error } = await supabase
      .from(table)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error(`Delete ${table} error:`, error)
      return { error: error.message }
    }

    // 2. Auto-delete items older than 30 days permanently
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const expiryStr = thirtyDaysAgo.toISOString()

    const tables = ["formulas", "shortcuts", "notes", "urls", "todos"]
    const validUuids = dbInfo.userIds.filter(isValidUUID)
    const nonUuids = dbInfo.userIds.filter((i) => !isValidUUID(i))

    Promise.all(
      tables.map(async (t) => {
        let cleanQuery = supabase.from(t).delete().eq("is_deleted", true).lt("deleted_at", expiryStr)
        if (validUuids.length > 0 && nonUuids.length > 0) {
          cleanQuery = cleanQuery.or(`user_id.in.(${validUuids.join(",")}),clerk_user_id.in.(${nonUuids.join(",")})`)
        } else if (validUuids.length > 0) {
          cleanQuery = cleanQuery.in("user_id", validUuids)
        } else if (nonUuids.length > 0) {
          cleanQuery = cleanQuery.in("clerk_user_id", nonUuids)
        }
        await cleanQuery
      })
    ).catch((err) => console.error("Auto 30-day cleanup error:", err))

    await logHistory({
      resourceId: id,
      resourceType: table,
      action: "deleted",
      userId: dbInfo.uuid,
    })

    revalidatePath(`/${table}`)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: any) {
    console.error(`deleteItemAction error on ${table}:`, err)
    return { error: err.message || "Failed to delete item" }
  }
}

export async function getDeletedItemsAction() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { data: [], error: "Unauthorized" }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress || null
    const dbInfo = await getUserDbInfo(clerkUserId, email)

    const supabase = createServiceRoleClient()

    const tables: ("formulas" | "notes" | "urls" | "todos" | "shortcuts")[] = [
      "formulas",
      "notes",
      "urls",
      "todos",
      "shortcuts",
    ]

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const expiryStr = thirtyDaysAgo.toISOString()

    const validUuids = dbInfo.userIds.filter(isValidUUID)
    const nonUuids = dbInfo.userIds.filter((i) => !isValidUUID(i))

    const results = await Promise.all(
      tables.map(async (table) => {
        // 1. Auto cleanup >30 days
        let delQuery = supabase.from(table).delete().eq("is_deleted", true).lt("deleted_at", expiryStr)
        if (validUuids.length > 0 && nonUuids.length > 0) {
          delQuery = delQuery.or(`user_id.in.(${validUuids.join(",")}),clerk_user_id.in.(${nonUuids.join(",")})`)
        } else if (validUuids.length > 0) {
          delQuery = delQuery.in("user_id", validUuids)
        } else if (nonUuids.length > 0) {
          delQuery = delQuery.in("clerk_user_id", nonUuids)
        }
        await delQuery

        // 2. Fetch deleted items
        let selectQuery = supabase.from(table).select("id, title, deleted_at").eq("is_deleted", true)
        if (validUuids.length > 0 && nonUuids.length > 0) {
          selectQuery = selectQuery.or(`user_id.in.(${validUuids.join(",")}),clerk_user_id.in.(${nonUuids.join(",")})`)
        } else if (validUuids.length > 0) {
          selectQuery = selectQuery.in("user_id", validUuids)
        } else if (nonUuids.length > 0) {
          selectQuery = selectQuery.in("clerk_user_id", nonUuids)
        }

        const { data, error } = await selectQuery
        if (error) {
          console.error(`Error fetching deleted items from ${table}:`, error)
          return []
        }

        return (data || []).map((item) => ({
          id: item.id,
          type: table.slice(0, -1) as any,
          title: item.title,
          deleted_at: item.deleted_at,
        }))
      })
    )

    const allDeleted = results
      .flat()
      .sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime())

    return { data: allDeleted }
  } catch (err: any) {
    console.error("getDeletedItemsAction error:", err)
    return { data: [], error: err.message || "Failed to fetch deleted items" }
  }
}

export async function restoreItemsAction(items: { id: string; type: string }[]) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { error: "Unauthorized" }

    const supabase = createServiceRoleClient()

    await Promise.all(
      items.map(async (item) => {
        const table = item.type === "shortcut" ? "shortcuts" : `${item.type}s`
        return supabase
          .from(table)
          .update({ is_deleted: false, deleted_at: null })
          .eq("id", item.id)
      })
    )

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: any) {
    console.error("restoreItemsAction error:", err)
    return { error: err.message || "Failed to restore items" }
  }
}

export async function permanentlyDeleteItemsAction(items: { id: string; type: string }[]) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { error: "Unauthorized" }

    const supabase = createServiceRoleClient()

    await Promise.all(
      items.map(async (item) => {
        const table = item.type === "shortcut" ? "shortcuts" : `${item.type}s`
        return supabase.from(table).delete().eq("id", item.id)
      })
    )

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: any) {
    console.error("permanentlyDeleteItemsAction error:", err)
    return { error: err.message || "Failed to permanently delete items" }
  }
}

export async function toggleFavoriteAction(table: string, id: string, currentFavorite: boolean) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { error: "Unauthorized" }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress || null
    const dbInfo = await getUserDbInfo(clerkUserId, email)

    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from(table)
      .update({ is_favorite: !currentFavorite })
      .eq("id", id)

    if (error) {
      console.error(`Toggle favorite ${table} error:`, error)
      return { error: error.message }
    }

    await logHistory({
      resourceId: id,
      resourceType: table,
      action: !currentFavorite ? "favorited" : "unfavorited",
      userId: dbInfo.uuid,
    })

    revalidatePath(`/${table}`)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: any) {
    console.error(`toggleFavoriteAction error on ${table}:`, err)
    return { error: err.message || "Failed to toggle favorite" }
  }
}

export async function removeSharedItemAction(resourceId: string, resourceType: string) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { error: "Unauthorized" }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress || null
    const dbInfo = await getUserDbInfo(clerkUserId, email)

    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from("shared_items")
      .delete()
      .eq("resource_id", resourceId)
      .eq("resource_type", resourceType)
      .in("shared_with_id", dbInfo.userIds)

    if (error) {
      console.error(`Remove shared item error on ${resourceType}:`, error)
      return { error: error.message }
    }

    revalidatePath(`/${resourceType}`)
    revalidatePath("/shared")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: any) {
    console.error(`removeSharedItemAction error on ${resourceType}:`, err)
    return { error: err.message || "Failed to remove shared item" }
  }
}

export async function getItemsAction(table: string, extraOptions?: any) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { data: [], error: "Unauthorized" }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress || null
    const dbInfo = await getUserDbInfo(clerkUserId, email)

    const supabase = createServiceRoleClient()
    return await fetchItemsForUser(supabase, table, dbInfo.userIds, extraOptions)
  } catch (err: any) {
    console.error(`getItemsAction error on ${table}:`, err)
    return { data: [], error: err.message || "Failed to fetch items" }
  }
}

export async function getDashboardItemsAction(params: {
  searchQuery?: string
  searchCategory?: string
  favoriteFilter?: string
  sharedFilter?: string
}) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { data: null, error: "Unauthorized" }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress || null
    const dbInfo = await getUserDbInfo(clerkUserId, email)

    const supabase = createServiceRoleClient()

    const {
      searchQuery = "",
      searchCategory = "all",
      favoriteFilter = "all",
      sharedFilter = "all",
    } = params

    const cleanQuery = searchQuery.trim().replace(/[*%]/g, "")
    const results: any = { formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} }

    const validUuids = dbInfo.userIds.filter(isValidUUID)
    const nonUuids = dbInfo.userIds.filter((id) => !isValidUUID(id))

    let sharedByMeIds: Record<string, string[]> = {
      formulas: [],
      shortcuts: [],
      notes: [],
      urls: [],
      todos: [],
    }

    if ((sharedFilter === "shared" || sharedFilter === "unshare") && validUuids.length > 0) {
      const { data: shares } = await supabase
        .from("shared_items")
        .select("resource_id, resource_type")
        .in("owner_id", validUuids)

      if (shares) {
        shares.forEach((s) => {
          if (sharedByMeIds[s.resource_type]) {
            sharedByMeIds[s.resource_type].push(s.resource_id)
          }
        })
      }
    }

    const categories = ["formulas", "shortcuts", "notes", "urls", "todos"]
    const categoriesToFetch = searchCategory === "all" || searchCategory === "new"
      ? categories
      : categories.includes(searchCategory)
      ? [searchCategory]
      : []

    await Promise.all(
      categoriesToFetch.map(async (table) => {
        let query = supabase
          .from(table)
          .select("*")
          .neq("is_deleted", true)

        if (validUuids.length > 0 && nonUuids.length > 0) {
          query = query.or(`user_id.in.(${validUuids.join(",")}),clerk_user_id.in.(${nonUuids.join(",")})`)
        } else if (validUuids.length > 0) {
          query = query.in("user_id", validUuids)
        } else if (nonUuids.length > 0) {
          query = query.in("clerk_user_id", nonUuids)
        }

        if (cleanQuery) {
          query = query.or(`title.ilike.*${cleanQuery}*,description.ilike.*${cleanQuery}*`)
        }

        if (favoriteFilter === "favorites") {
          query = query.eq("is_favorite", true)
        } else if (favoriteFilter === "unfavorites") {
          query = query.eq("is_favorite", false)
        }

        if (sharedFilter === "shared") {
          query = query.in("id", sharedByMeIds[table] || [])
        } else if (sharedFilter === "unshare") {
          const sharedIds = sharedByMeIds[table] || []
          if (sharedIds.length > 0) {
            query = query.not("id", "in", `(${sharedIds.join(",")})`)
          }
        } else if (sharedFilter === "received") {
          query = query.eq("id", "00000000-0000-0000-0000-000000000000")
        }

        const limitCount = searchCategory === "new" ? 5 : 50
        const { data: owned, error: ownedErr } = await query.order("created_at", { ascending: false }).limit(limitCount)
        if (ownedErr) {
          console.error(`getDashboardItemsAction error fetching ${table}:`, ownedErr)
        }

        let shared: any[] = []
        if (sharedFilter !== "shared" && sharedFilter !== "unshare" && validUuids.length > 0) {
          const { data: sharedItems } = await supabase
            .from("shared_items")
            .select("resource_id, permission, created_at")
            .in("shared_with_id", validUuids)
            .eq("resource_type", table)

          if (sharedItems && sharedItems.length > 0) {
            const ids = sharedItems.map((s) => s.resource_id)
            let sharedQuery = supabase.from(table).select("*").in("id", ids).neq("is_deleted", true)
            if (cleanQuery) {
              sharedQuery = sharedQuery.or(`title.ilike.*${cleanQuery}*,description.ilike.*${cleanQuery}*`)
            }
            if (favoriteFilter === "favorites") sharedQuery = sharedQuery.eq("is_favorite", true)
            else if (favoriteFilter === "unfavorites") sharedQuery = sharedQuery.eq("is_favorite", false)
            const { data } = await sharedQuery
            shared = (data || []).map((item) => ({
              ...item,
              shared_permission: sharedItems.find((s) => s.resource_id === item.id)?.permission,
              received_at: sharedItems.find((s) => s.resource_id === item.id)?.created_at,
            }))
          }
        }

        const combined = [...(owned || []), ...shared].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        results[table] = combined.slice(0, limitCount)
      })
    )

    const allOwnedIds: string[] = []
    Object.keys(results).forEach((cat) => {
      if (Array.isArray(results[cat])) {
        results[cat].forEach((item: any) => {
          if (item.id) allOwnedIds.push(item.id)
        })
      }
    })

    if (allOwnedIds.length > 0) {
      const { data: sharesInfoData } = await supabase
        .from("shared_items")
        .select("resource_id, shared_with_id")
        .in("resource_id", allOwnedIds)

      if (sharesInfoData) {
        const sharesInfo: Record<string, string[]> = {}
        sharesInfoData.forEach((s) => {
          if (!sharesInfo[s.resource_id]) sharesInfo[s.resource_id] = []
          sharesInfo[s.resource_id].push(s.shared_with_id)
        })
        results.sharesInfo = sharesInfo
      }
    }

    return { data: results, error: null }
  } catch (err: any) {
    console.error("getDashboardItemsAction error:", err)
    return { data: null, error: err.message || "Failed to fetch dashboard items" }
  }
}

export async function getSharedItemsAction() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { data: null, error: "Unauthorized" }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress || null
    const dbInfo = await getUserDbInfo(clerkUserId, email)

    const supabase = createServiceRoleClient()

    const validUuids = dbInfo.userIds.filter(isValidUUID)
    const nonUuids = dbInfo.userIds.filter((id) => !isValidUUID(id))

    if (validUuids.length === 0 && nonUuids.length === 0) {
      return { data: { formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} }, error: null }
    }

    let sharedQuery = supabase
      .from("shared_items")
      .select("resource_id, resource_type, permission, created_at")

    if (validUuids.length > 0 && nonUuids.length > 0) {
      sharedQuery = sharedQuery.or(`shared_with_id.in.(${validUuids.join(",")}),clerk_user_id.in.(${nonUuids.join(",")})`)
    } else if (validUuids.length > 0) {
      sharedQuery = sharedQuery.in("shared_with_id", validUuids)
    } else if (nonUuids.length > 0) {
      sharedQuery = sharedQuery.in("clerk_user_id", nonUuids)
    }

    const { data: sharedItems, error: sharedError } = await sharedQuery

    if (sharedError) {
      console.error("getSharedItemsAction error:", sharedError)
      return { data: null, error: sharedError.message }
    }

    const results: any = { formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} }

    if (sharedItems && sharedItems.length > 0) {
      const fetchDetails = async (type: string, table: string) => {
        const typeShares = sharedItems.filter((s) => s.resource_type === type)
        if (typeShares.length === 0) return []

        const ids = typeShares.map((s) => s.resource_id)
        const { data } = await supabase
          .from(table)
          .select("*")
          .in("id", ids)
          .neq("is_deleted", true)

        return (data || []).map((item) => ({
          ...item,
          shared_permission: typeShares.find((s) => s.resource_id === item.id)?.permission,
          received_at: typeShares.find((s) => s.resource_id === item.id)?.created_at,
        }))
      }

      const [formulas, shortcuts, notes, urls, todos] = await Promise.all([
        fetchDetails("formulas", "formulas"),
        fetchDetails("shortcuts", "shortcuts"),
        fetchDetails("notes", "notes"),
        fetchDetails("urls", "urls"),
        fetchDetails("todos", "todos"),
      ])

      results.formulas = formulas
      results.shortcuts = shortcuts
      results.notes = notes
      results.urls = urls
      results.todos = todos

      const todoIds = todos.map((t: any) => t.id)
      if (todoIds.length > 0) {
        results.sharesInfo = await getBatchSharedWith(todoIds, "todos")
      }
    }

    return { data: results, error: null }
  } catch (err: any) {
    console.error("getSharedItemsAction exception:", err)
    return { data: null, error: err.message || "Failed to fetch shared items" }
  }
}




