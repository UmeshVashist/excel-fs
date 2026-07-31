"use server"

import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserDbInfo, fetchItemsForUser } from "@/lib/supabase/user-helper"
import { revalidatePath } from "next/cache"
import { logHistory } from "./sharing-actions"


export async function addItemAction(table: string, payload: any) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { error: "Unauthorized" }

    const supabase = createServiceRoleClient()
    const dbInfo = await getUserDbInfo(clerkUserId)

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.user_id || "")
    const insertData = {
      ...payload,
      user_id: isUUID ? payload.user_id : dbInfo.uuid,
      clerk_user_id: clerkUserId,
      is_deleted: false,
    }

    const { data, error } = await supabase.from(table).insert(insertData).select().single()

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

    const supabase = createServiceRoleClient()
    const dbInfo = await getUserDbInfo(clerkUserId)

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

    const supabase = createServiceRoleClient()
    const dbInfo = await getUserDbInfo(clerkUserId)

    // Soft delete: move to Recycle Bin
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

export async function toggleFavoriteAction(table: string, id: string, currentFavorite: boolean) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { error: "Unauthorized" }

    const supabase = createServiceRoleClient()
    const dbInfo = await getUserDbInfo(clerkUserId)

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

    const supabase = createServiceRoleClient()
    const dbInfo = await getUserDbInfo(clerkUserId)

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


