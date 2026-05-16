"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { FormulaList } from "@/components/formula-list"
import { ShortcutList } from "@/components/shortcut-list"
import { NotesList } from "@/components/notes-list"
import { UrlsList } from "@/components/urls-list"
import { TodoItem } from "@/components/todo-item"
import { SearchingLoader } from "@/components/searching-loader"
import { SetupAccountPopup } from "@/components/setup-account-popup"
import { FormulaForm } from "@/components/formula-form"
import { ShortcutForm } from "@/components/shortcut-form"
import { NoteForm } from "@/components/note-form"
import { UrlForm } from "@/components/url-form"
import { TodoForm } from "@/components/todo-form"
import { getBatchSharedWith } from "@/lib/sharing-actions"

export function DashboardClient({
  initialFormulasCount,
  initialShortcutsCount,
  initialNotesCount,
  initialUrlsCount,
  initialTodosCount,
  initialSharedCount,
  userId,
}: {
  initialFormulasCount: number
  initialShortcutsCount: number
  initialNotesCount: number
  initialUrlsCount: number
  initialTodosCount: number
  initialSharedCount: number
  userId: string
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchCategory, setSearchCategory] = useState("all")
  const [favoriteFilter, setFavoriteFilter] = useState("all")
  const [searchResults, setSearchResults] = useState<any>({
    formulas: [],
    shortcuts: [],
    notes: [],
    urls: [],
    todos: [],
    sharesInfo: {},
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSetupPopupOpen, setIsSetupPopupOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [editingItem, setEditingItem] = useState<{ type: string; data: any } | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleUpdate = async () => {
    // Re-trigger the search to update the results
    const results: any = { formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} }
    setIsLoading(true)

    let sharedByMeIds: Record<string, string[]> = {
      formulas: [],
      shortcuts: [],
      notes: [],
      urls: [],
      todos: []
    }

    if (favoriteFilter === "shared") {
      const { data: shares } = await supabase
        .from("shared_items")
        .select("resource_id, resource_type")
        .eq("owner_id", userId)
      
      if (shares) {
        shares.forEach(s => {
          if (sharedByMeIds[s.resource_type]) {
            sharedByMeIds[s.resource_type].push(s.resource_id)
          }
        })
      }
    }

    const applyFilters = (query: any, type: string) => {
      if (favoriteFilter === "favorites") {
        query = query.eq("is_favorite", true)
      } else if (favoriteFilter === "unfavorites") {
        query = query.eq("is_favorite", false)
      } else if (favoriteFilter === "shared") {
        query = query.in("id", sharedByMeIds[type] || [])
      }
      return query
    }

    if (searchCategory === "all" || searchCategory === "formulas" || searchCategory === "shared") {
      let query = supabase
        .from("formulas")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .ilike("title", `%${searchQuery}%`)
      
      query = applyFilters(query, "formulas")
      
      // If category is "shared", we only want items shared with us, not owned ones
      const { data: owned } = searchCategory === "shared" ? { data: [] } : await query.limit(5)
      
      // Fetch shared
      let shared: any[] = []
      if (favoriteFilter !== "shared") {
        const { data: sharedItems } = await supabase
          .from("shared_items")
          .select("resource_id, permission")
          .eq("shared_with_id", userId)
          .eq("resource_type", "formulas")
        
        if (sharedItems && sharedItems.length > 0) {
          const ids = sharedItems.map(s => s.resource_id)
          let sharedQuery = supabase.from("formulas").select("*").in("id", ids).eq("is_deleted", false).ilike("title", `%${searchQuery}%`)
          if (favoriteFilter === "favorites") sharedQuery = sharedQuery.eq("is_favorite", true)
          else if (favoriteFilter === "unfavorites") sharedQuery = sharedQuery.eq("is_favorite", false)
          const { data } = await sharedQuery
          shared = (data || []).map(f => ({
            ...f,
            shared_permission: sharedItems.find(s => s.resource_id === f.id)?.permission
          }))
        }
      }
      
      results.formulas = [...(owned || []), ...shared].slice(0, 5)
    }

    if (searchCategory === "all" || searchCategory === "shortcuts" || searchCategory === "shared") {
      let query = supabase
        .from("shortcuts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .ilike("title", `%${searchQuery}%`)
      
      query = applyFilters(query, "shortcuts")
      const { data: owned } = searchCategory === "shared" ? { data: [] } : await query.limit(5)

      // Fetch shared
      let shared: any[] = []
      if (favoriteFilter !== "shared") {
        const { data: sharedItems } = await supabase
          .from("shared_items")
          .select("resource_id, permission")
          .eq("shared_with_id", userId)
          .eq("resource_type", "shortcuts")
        
        if (sharedItems && sharedItems.length > 0) {
          const ids = sharedItems.map(s => s.resource_id)
          let sharedQuery = supabase.from("shortcuts").select("*").in("id", ids).eq("is_deleted", false).ilike("title", `%${searchQuery}%`)
          if (favoriteFilter === "favorites") sharedQuery = sharedQuery.eq("is_favorite", true)
          else if (favoriteFilter === "unfavorites") sharedQuery = sharedQuery.eq("is_favorite", false)
          const { data } = await sharedQuery
          shared = (data || []).map(s => ({
            ...s,
            shared_permission: sharedItems.find(item => item.resource_id === s.id)?.permission
          }))
        }
      }
      
      results.shortcuts = [...(owned || []), ...shared].slice(0, 5)
    }

    if (searchCategory === "all" || searchCategory === "notes" || searchCategory === "shared") {
      let query = supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .ilike("title", `%${searchQuery}%`)
      
      query = applyFilters(query, "notes")
      const { data: owned } = searchCategory === "shared" ? { data: [] } : await query.limit(5)

      // Fetch shared
      let shared: any[] = []
      if (favoriteFilter !== "shared") {
        const { data: sharedItems } = await supabase
          .from("shared_items")
          .select("resource_id, permission")
          .eq("shared_with_id", userId)
          .eq("resource_type", "notes")
        
        if (sharedItems && sharedItems.length > 0) {
          const ids = sharedItems.map(s => s.resource_id)
          let sharedQuery = supabase.from("notes").select("*").in("id", ids).eq("is_deleted", false).ilike("title", `%${searchQuery}%`)
          if (favoriteFilter === "favorites") sharedQuery = sharedQuery.eq("is_favorite", true)
          else if (favoriteFilter === "unfavorites") sharedQuery = sharedQuery.eq("is_favorite", false)
          const { data } = await sharedQuery
          shared = (data || []).map(n => ({
            ...n,
            shared_permission: sharedItems.find(item => item.resource_id === n.id)?.permission
          }))
        }
      }
      
      results.notes = [...(owned || []), ...shared].slice(0, 5)
    }

    if (searchCategory === "all" || searchCategory === "urls" || searchCategory === "shared") {
      let query = supabase
        .from("urls")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .ilike("title", `%${searchQuery}%`)
      
      query = applyFilters(query, "urls")
      const { data: owned } = searchCategory === "shared" ? { data: [] } : await query.limit(5)

      // Fetch shared
      let shared: any[] = []
      if (favoriteFilter !== "shared") {
        const { data: sharedItems } = await supabase
          .from("shared_items")
          .select("resource_id, permission")
          .eq("shared_with_id", userId)
          .eq("resource_type", "urls")
        
        if (sharedItems && sharedItems.length > 0) {
          const ids = sharedItems.map(s => s.resource_id)
          let sharedQuery = supabase.from("urls").select("*").in("id", ids).eq("is_deleted", false).ilike("title", `%${searchQuery}%`)
          if (favoriteFilter === "favorites") sharedQuery = sharedQuery.eq("is_favorite", true)
          else if (favoriteFilter === "unfavorites") sharedQuery = sharedQuery.eq("is_favorite", false)
          const { data } = await sharedQuery
          shared = (data || []).map(u => ({
            ...u,
            shared_permission: sharedItems.find(item => item.resource_id === u.id)?.permission
          }))
        }
      }
      
      results.urls = [...(owned || []), ...shared].slice(0, 5)
    }

    if (searchCategory === "all" || searchCategory === "todos" || searchCategory === "shared") {
      let query = supabase
        .from("todos")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .ilike("title", `%${searchQuery}%`)
      
      query = applyFilters(query, "todos")
      const { data: owned } = searchCategory === "shared" ? { data: [] } : await query.limit(5)

      // Fetch shared
      let shared: any[] = []
      if (favoriteFilter !== "shared") {
        const { data: sharedItems } = await supabase
          .from("shared_items")
          .select("resource_id, permission")
          .eq("shared_with_id", userId)
          .eq("resource_type", "todos")
        
        if (sharedItems && sharedItems.length > 0) {
          const ids = sharedItems.map(s => s.resource_id)
          let sharedQuery = supabase.from("todos").select("*").in("id", ids).eq("is_deleted", false).ilike("title", `%${searchQuery}%`)
          if (favoriteFilter === "favorites") sharedQuery = sharedQuery.eq("is_favorite", true)
          else if (favoriteFilter === "unfavorites") sharedQuery = sharedQuery.eq("is_favorite", false)
          const { data } = await sharedQuery
          shared = (data || []).map(t => ({
            ...t,
            shared_permission: sharedItems.find(item => item.resource_id === t.id)?.permission
          }))
        }
      }
      
      results.todos = [...(owned || []), ...shared].slice(0, 5)
    }

    setSearchResults(results)
    setIsLoading(false)
  }

  const handleEdit = (type: string, data: any) => {
    setEditingItem({ type, data })
    setIsFormOpen(true)
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const checkSetup = async () => {
      if (searchParams.get("new_user") === "true") {
        setIsSetupPopupOpen(true)
        // Remove the query param without refreshing the page
        const url = new URL(window.location.href)
        url.searchParams.delete("new_user")
        window.history.replaceState({}, "", url.toString())
        return
      }

      // Also check if password_set is false for the current user
      const { data: profile } = await supabase
        .from("profiles")
        .select("password_set")
        .eq("id", userId)
        .maybeSingle()
      
      if (profile && profile.password_set === false) {
        setIsSetupPopupOpen(true)
      }
    }

    checkSetup()
  }, [searchParams, supabase, userId])
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ formulas: [], shortcuts: [], notes: [], urls: [], todos: [] })
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      const results: any = { formulas: [], shortcuts: [], notes: [], urls: [], todos: [] }

      const applyFavoriteFilter = (query: any) => {
        if (favoriteFilter === "favorites") {
          return query.eq("is_favorite", true)
        } else if (favoriteFilter === "unfavorites") {
          return query.eq("is_favorite", false)
        }
        return query
      }

      // Search based on category selection
      if (searchCategory === "all" || searchCategory === "formulas") {
        let query = supabase
          .from("formulas")
          .select("*")
          .eq("user_id", userId)
          .eq("is_deleted", false)
          .ilike("title", `%${searchQuery}%`)
        
        query = applyFavoriteFilter(query)
        const { data: owned } = await query.limit(5)

        // Fetch shared
        const { data: sharedItems } = await supabase
          .from("shared_items")
          .select("resource_id, permission")
          .eq("shared_with_id", userId)
          .eq("resource_type", "formulas")
        
        let shared: any[] = []
        if (sharedItems && sharedItems.length > 0) {
          const ids = sharedItems.map(s => s.resource_id)
          let sharedQuery = supabase.from("formulas").select("*").in("id", ids).eq("is_deleted", false).ilike("title", `%${searchQuery}%`)
          sharedQuery = applyFavoriteFilter(sharedQuery)
          const { data } = await sharedQuery
          shared = (data || []).map(f => ({
            ...f,
            shared_permission: sharedItems.find(s => s.resource_id === f.id)?.permission
          }))
        }
        
        results.formulas = [...(owned || []), ...shared].slice(0, 5)
      }

      if (searchCategory === "all" || searchCategory === "shortcuts") {
        let query = supabase
          .from("shortcuts")
          .select("*")
          .eq("user_id", userId)
          .eq("is_deleted", false)
          .ilike("title", `%${searchQuery}%`)
        
        query = applyFavoriteFilter(query)
        const { data: owned } = await query.limit(5)

        // Fetch shared
        const { data: sharedItems } = await supabase
          .from("shared_items")
          .select("resource_id, permission")
          .eq("shared_with_id", userId)
          .eq("resource_type", "shortcuts")
        
        let shared: any[] = []
        if (sharedItems && sharedItems.length > 0) {
          const ids = sharedItems.map(s => s.resource_id)
          let sharedQuery = supabase.from("shortcuts").select("*").in("id", ids).eq("is_deleted", false).ilike("title", `%${searchQuery}%`)
          sharedQuery = applyFavoriteFilter(sharedQuery)
          const { data } = await sharedQuery
          shared = (data || []).map(s => ({
            ...s,
            shared_permission: sharedItems.find(item => item.resource_id === s.id)?.permission
          }))
        }
        
        results.shortcuts = [...(owned || []), ...shared].slice(0, 5)
      }

      if (searchCategory === "all" || searchCategory === "notes") {
        let query = supabase
          .from("notes")
          .select("*")
          .eq("user_id", userId)
          .eq("is_deleted", false)
          .ilike("title", `%${searchQuery}%`)
        
        query = applyFavoriteFilter(query)
        const { data: owned } = await query.limit(5)

        // Fetch shared
        const { data: sharedItems } = await supabase
          .from("shared_items")
          .select("resource_id, permission")
          .eq("shared_with_id", userId)
          .eq("resource_type", "notes")
        
        let shared: any[] = []
        if (sharedItems && sharedItems.length > 0) {
          const ids = sharedItems.map(s => s.resource_id)
          let sharedQuery = supabase.from("notes").select("*").in("id", ids).eq("is_deleted", false).ilike("title", `%${searchQuery}%`)
          sharedQuery = applyFavoriteFilter(sharedQuery)
          const { data } = await sharedQuery
          shared = (data || []).map(n => ({
            ...n,
            shared_permission: sharedItems.find(item => item.resource_id === n.id)?.permission
          }))
        }
        
        results.notes = [...(owned || []), ...shared].slice(0, 5)
      }

      if (searchCategory === "all" || searchCategory === "urls") {
        let query = supabase
          .from("urls")
          .select("*")
          .eq("user_id", userId)
          .eq("is_deleted", false)
          .ilike("title", `%${searchQuery}%`)
        
        query = applyFavoriteFilter(query)
        const { data: owned } = await query.limit(5)

        // Fetch shared
        const { data: sharedItems } = await supabase
          .from("shared_items")
          .select("resource_id, permission")
          .eq("shared_with_id", userId)
          .eq("resource_type", "urls")
        
        let shared: any[] = []
        if (sharedItems && sharedItems.length > 0) {
          const ids = sharedItems.map(s => s.resource_id)
          let sharedQuery = supabase.from("urls").select("*").in("id", ids).eq("is_deleted", false).ilike("title", `%${searchQuery}%`)
          sharedQuery = applyFavoriteFilter(sharedQuery)
          const { data } = await sharedQuery
          shared = (data || []).map(u => ({
            ...u,
            shared_permission: sharedItems.find(item => item.resource_id === u.id)?.permission
          }))
        }
        
        results.urls = [...(owned || []), ...shared].slice(0, 5)
      }

      if (searchCategory === "all" || searchCategory === "todos") {
        let query = supabase
          .from("todos")
          .select("*")
          .eq("user_id", userId)
          .eq("is_deleted", false)
          .ilike("title", `%${searchQuery}%`)
        
        query = applyFavoriteFilter(query)
        const { data: owned } = await query.limit(5)

        // Fetch shared
        const { data: sharedItems } = await supabase
          .from("shared_items")
          .select("resource_id, permission")
          .eq("shared_with_id", userId)
          .eq("resource_type", "todos")
        
        let shared: any[] = []
        if (sharedItems && sharedItems.length > 0) {
          const ids = sharedItems.map(s => s.resource_id)
          let sharedQuery = supabase.from("todos").select("*").in("id", ids).eq("is_deleted", false).ilike("title", `%${searchQuery}%`)
          sharedQuery = applyFavoriteFilter(sharedQuery)
          const { data } = await sharedQuery
          shared = (data || []).map(t => ({
            ...t,
            shared_permission: sharedItems.find(item => item.resource_id === t.id)?.permission
          }))
        }
        
        results.todos = [...(owned || []), ...shared].slice(0, 5)

        // Fetch shares info for todos
        const ownedIds = (owned || []).map(t => t.id)
        if (ownedIds.length > 0) {
          results.sharesInfo = await getBatchSharedWith(ownedIds, "todos")
        }
      }

      setSearchResults(results)
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, searchCategory, favoriteFilter, userId, supabase])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Link href="/formulas" className="block">
          <Card className="border text-center border-cyan-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all duration-1000 card-hover-cyan hover:scale-105 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-cyan-500 text-lg">Formulas</CardTitle>
              <CardDescription className="text-cyan-500 text-2xl font-bold">{initialFormulasCount}</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/shortcuts" className="block">
          <Card className="border text-center border-orange-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all duration-1000 card-hover-orange hover:scale-105 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-500 text-lg">Shortcuts</CardTitle>
              <CardDescription className="text-orange-500 text-2xl font-bold">{initialShortcutsCount}</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/notes" className="block">
          <Card className="border text-center border-green-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all duration-1000 card-hover-green hover:scale-105 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-500 text-lg">Notes</CardTitle>
              <CardDescription className="text-green-500 text-2xl font-bold">{initialNotesCount}</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/urls" className="block">
          <Card className="border text-center border-orange-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all duration-1000 card-hover-orange hover:scale-105 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-500 text-lg">URLs</CardTitle>
              <CardDescription className="text-orange-500 text-2xl font-bold">{initialUrlsCount}</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/todos" className="block">
          <Card className="border text-center border-cyan-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all duration-1000 card-hover-cyan hover:scale-105 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-cyan-500 text-lg">Todos</CardTitle>
              <CardDescription className="text-cyan-500 text-2xl font-bold">{initialTodosCount}</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/shared" className="block">
          <Card className="border text-center border-indigo-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all duration-1000 card-hover-indigo hover:scale-105 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-indigo-500 text-lg">Shared with me</CardTitle>
              <CardDescription className="text-indigo-500 text-2xl font-bold">{initialSharedCount}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card className="border text-center  bg-white/5 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all your data by title..."
                autoComplete="off"
                className="pl-10 pr-10 bg-slate-950/20 text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {isMounted && (
              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <Select value={searchCategory} onValueChange={setSearchCategory}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/20 text-white hover:cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
                    <SelectItem value="all" className="text-cyan-500 hover:cursor-pointer">
                      All Items
                    </SelectItem>
                    <SelectItem value="notes" className="text-green-500 hover:cursor-pointer">
                      Notes
                    </SelectItem>
                    <SelectItem value="urls" className="text-orange-500 hover:cursor-pointer">
                      URLs
                    </SelectItem>
                    <SelectItem value="todos" className="text-cyan-500 hover:cursor-pointer">
                      Todos
                    </SelectItem>
                    <SelectItem value="formulas" className="text-cyan-500 hover:cursor-pointer">
                      Formulas
                    </SelectItem>
                    <SelectItem value="shortcuts" className="text-orange-500 hover:cursor-pointer">
                      Shortcuts
                    </SelectItem>
                    <SelectItem value="shared" className="text-indigo-500 hover:cursor-pointer">
                      Shared
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/20 text-white hover:cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
                    <SelectItem value="all" className="text-white hover:cursor-pointer">
                      All
                    </SelectItem>
                    <SelectItem value="favorites" className="text-orange-500 hover:cursor-pointer">
                      Favorites
                    </SelectItem>
                    <SelectItem value="unfavorites" className="text-green-500 hover:cursor-pointer">
                      Unfavorites
                    </SelectItem>
                    <SelectItem value="shared" className="text-indigo-500 hover:cursor-pointer">
                      Shared
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {searchQuery && (
        <div className="space-y-8">
          {isLoading && <SearchingLoader />}

          {searchResults.notes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-500">Notes</h3>
              <NotesList notes={searchResults.notes} onEdit={(note) => handleEdit("note", note)} onUpdate={handleUpdate} currentUserId={userId} />
            </div>
          )}

          {searchResults.urls.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-500">URLs</h3>
              <UrlsList urls={searchResults.urls} onEdit={(url) => handleEdit("url", url)} onUpdate={handleUpdate} currentUserId={userId} />
            </div>
          )}

          {searchResults.todos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-500">Todos</h3>
              <div className="grid gap-4">
                {searchResults.todos.map((todo: any) => (
                  <TodoItem 
                    key={todo.id} 
                    todo={todo} 
                    onEdit={(todo) => handleEdit("todo", todo)} 
                    onUpdate={handleUpdate} 
                    currentUserId={userId}
                    initialShares={searchResults.sharesInfo?.[todo.id] || []}
                  />
                ))}
              </div>
            </div>
          )}

          {searchResults.formulas.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-500">Formulas</h3>
              <FormulaList formulas={searchResults.formulas} onEdit={(formula) => handleEdit("formula", formula)} onUpdate={handleUpdate} currentUserId={userId} />
            </div>
          )}

          {searchResults.shortcuts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-500">Shortcuts</h3>
              <ShortcutList shortcuts={searchResults.shortcuts} onEdit={(shortcut) => handleEdit("shortcut", shortcut)} onUpdate={handleUpdate} currentUserId={userId} />
            </div>
          )}

          {!isLoading &&
            searchResults.notes.length === 0 &&
            searchResults.urls.length === 0 &&
            searchResults.todos.length === 0 &&
            searchResults.formulas.length === 0 &&
            searchResults.shortcuts.length === 0 && (
              <p className="text-center text-red-500 py-8">No results found matching your search.</p>
            )}
        </div>
      )}

      <SetupAccountPopup
        isOpen={isSetupPopupOpen}
        onClose={() => setIsSetupPopupOpen(false)}
      />

      {editingItem?.type === "formula" && (
        <FormulaForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          formula={editingItem.data}
          userId={userId}
        />
      )}
      {editingItem?.type === "shortcut" && (
        <ShortcutForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          shortcut={editingItem.data}
          userId={userId}
        />
      )}
      {editingItem?.type === "note" && (
        <NoteForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          note={editingItem.data}
          userId={userId}
        />
      )}
      {editingItem?.type === "url" && (
        <UrlForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          url={editingItem.data}
          userId={userId}
        />
      )}
      {editingItem?.type === "todo" && (
        <TodoForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          todo={editingItem.data}
          userId={userId}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
