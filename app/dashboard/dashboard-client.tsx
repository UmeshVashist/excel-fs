"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { NotesList } from "@/components/notes-list"
import { UrlsList } from "@/components/urls-list"
import { FormulaList } from "@/components/formula-list"
import { ShortcutList } from "@/components/shortcut-list"
import { TodoItem } from "@/components/todo-item"
import { getBatchSharedWith } from "@/lib/sharing-actions"
import { SearchingLoader } from "@/components/searching-loader"
import { SetupAccountPopup } from "@/components/setup-account-popup"
import { FormulaForm } from "@/components/formula-form"
import { ShortcutForm } from "@/components/shortcut-form"
import { NoteForm } from "@/components/note-form"
import { UrlForm } from "@/components/url-form"
import { TodoForm } from "@/components/todo-form"
import { Todo } from "@/types/todo"

interface DashboardClientProps {
  userId: string
  initialFormulasCount: number
  initialShortcutsCount: number
  initialNotesCount: number
  initialUrlsCount: number
  initialTodosCount: number
  initialSharedCount: number
}

export function DashboardClient({
  userId,
  initialFormulasCount,
  initialShortcutsCount,
  initialNotesCount,
  initialUrlsCount,
  initialTodosCount,
  initialSharedCount
}: DashboardClientProps) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchCategory, setSearchCategory] = useState("all")
  const [favoriteFilter, setFavoriteFilter] = useState("all")
  const [sharedFilter, setSharedFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any>({
    formulas: [],
    shortcuts: [],
    notes: [],
    urls: [],
    todos: [],
    sharesInfo: {}
  })
  const [isMounted, setIsMounted] = useState(false)
  const [isSetupPopupOpen, setIsSetupPopupOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<{ type: string; data: any } | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleUpdate = async (isManual = false) => {
    // We search if there's a query OR if it's the "new" category OR if it's a manual search trigger OR if any filter is active
    if (!isManual && !searchQuery.trim() && searchCategory !== "new" && favoriteFilter === "all" && sharedFilter === "all") {
      setSearchResults({ formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} })
      return
    }

    setIsLoading(true)
    
    // Add a small delay to ensure the searching animation is visible
    await new Promise(resolve => setTimeout(resolve, 1000))

    const results: any = { formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} }

    let sharedByMeIds: Record<string, string[]> = {
      formulas: [],
      shortcuts: [],
      notes: [],
      urls: [],
      todos: []
    }

    if (sharedFilter === "shared" || sharedFilter === "unshare") {
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
      }
      
      if (sharedFilter === "shared") {
        // Items shared BY me
        query = query.in("id", sharedByMeIds[type] || [])
      } else if (sharedFilter === "unshare") {
        // Items NOT shared by me
        const sharedIds = sharedByMeIds[type] || []
        if (sharedIds.length > 0) {
          query = query.not("id", "in", `(${sharedIds.join(",")})`)
        }
      } else if (sharedFilter === "received") {
        // Items shared WITH me - force empty for owned query
        return query.eq("id", "00000000-0000-0000-0000-000000000000")
      }
      return query
    }

    // Search based on category selection
    if (searchCategory === "new") {
      // Fetch only recently created items across all categories
      const fetchRecent = async (table: string) => {
        let query = supabase
          .from(table)
          .select("*")
          .eq("user_id", userId)
          .eq("is_deleted", false)
          .ilike("title", `%${searchQuery}%`)
          .order("created_at", { ascending: false })
          .limit(5)
        
        if (favoriteFilter === "favorites") query = query.eq("is_favorite", true)
        else if (favoriteFilter === "unfavorites") query = query.eq("is_favorite", false)
        
        const { data } = await query
        return data || []
      }

      const [formulas, shortcuts, notes, urls, todos] = await Promise.all([
        fetchRecent("formulas"),
        fetchRecent("shortcuts"),
        fetchRecent("notes"),
        fetchRecent("urls"),
        fetchRecent("todos")
      ])

      results.formulas = formulas
      results.shortcuts = shortcuts
      results.notes = notes
      results.urls = urls
      results.todos = todos
    } else {
      if (searchCategory === "all" || searchCategory === "formulas") {
        let query = supabase
          .from("formulas")
          .select("*")
          .eq("user_id", userId)
          .eq("is_deleted", false)
          .ilike("title", `%${searchQuery}%`)
        
        query = applyFilters(query, "formulas")
        const { data: owned } = await query.limit(5)

        // Fetch shared
        let shared: any[] = []
        if (sharedFilter !== "shared" && sharedFilter !== "unshare") {
          const { data: sharedItems } = await supabase
            .from("shared_items")
            .select("resource_id, permission, created_at")
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
              shared_permission: sharedItems.find(s => s.resource_id === f.id)?.permission,
              received_at: sharedItems.find(s => s.resource_id === f.id)?.created_at
            }))
          }
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
        
        query = applyFilters(query, "shortcuts")
        const { data: owned } = await query.limit(5)

        // Fetch shared
        let shared: any[] = []
        if (sharedFilter !== "shared" && sharedFilter !== "unshare") {
          const { data: sharedItems } = await supabase
            .from("shared_items")
            .select("resource_id, permission, created_at")
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
              shared_permission: sharedItems.find(item => item.resource_id === s.id)?.permission,
              received_at: sharedItems.find(item => item.resource_id === s.id)?.created_at
            }))
          }
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
        
        query = applyFilters(query, "notes")
        const { data: owned } = await query.limit(5)

        // Fetch shared
        let shared: any[] = []
        if (sharedFilter !== "shared" && sharedFilter !== "unshare") {
          const { data: sharedItems } = await supabase
            .from("shared_items")
            .select("resource_id, permission, created_at")
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
              shared_permission: sharedItems.find(item => item.resource_id === n.id)?.permission,
              received_at: sharedItems.find(item => item.resource_id === n.id)?.created_at
            }))
          }
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
        
        query = applyFilters(query, "urls")
        const { data: owned } = await query.limit(5)

        // Fetch shared
        let shared: any[] = []
        if (sharedFilter !== "shared" && sharedFilter !== "unshare") {
          const { data: sharedItems } = await supabase
            .from("shared_items")
            .select("resource_id, permission, created_at")
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
              shared_permission: sharedItems.find(item => item.resource_id === u.id)?.permission,
              received_at: sharedItems.find(item => item.resource_id === u.id)?.created_at
            }))
          }
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
        
        query = applyFilters(query, "todos")
        const { data: owned } = await query.limit(5)

        // Fetch shared
        let shared: any[] = []
        if (sharedFilter !== "shared" && sharedFilter !== "unshare") {
          const { data: sharedItems } = await supabase
            .from("shared_items")
            .select("resource_id, permission, created_at")
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
              shared_permission: sharedItems.find(item => item.resource_id === t.id)?.permission,
              received_at: sharedItems.find(item => item.resource_id === t.id)?.created_at
            }))
          }
        }
        
        results.todos = [...(owned || []), ...shared].slice(0, 5)

        // Fetch shares info for todos
        const ownedIds = (owned || []).map(t => t.id)
        if (ownedIds.length > 0) {
          results.sharesInfo = await getBatchSharedWith(ownedIds, "todos")
        }
      }
    }

    setSearchResults(results)
    setIsLoading(false)
    setHasSearched(true)
  }

  const handleEdit = (type: string, data: any) => {
    setEditingItem({ type, data })
    setIsFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingItem(null)
      handleUpdate() // Refresh data without full page reload
    }
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
    if (!searchQuery.trim() && searchCategory !== "new" && favoriteFilter === "all" && sharedFilter === "all") {
      setSearchResults({ formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} })
      return
    }
    
    const timer = setTimeout(() => {
      handleUpdate()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, searchCategory, favoriteFilter, sharedFilter])

  const handleClear = () => {
    setSearchQuery("")
    setSearchCategory("all")
    setFavoriteFilter("all")
    setSharedFilter("all")
    setSearchResults({ formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} })
    setIsLoading(false)
    setHasSearched(false)
  }

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
          <Card className="border text-center border-cyan-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all duration-1000 card-hover-cyan hover:scale-105 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-cyan-500 text-lg">Notes</CardTitle>
              <CardDescription className="text-cyan-500 text-2xl font-bold">{initialNotesCount}</CardDescription>
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
          <Card className="border text-center border-orange-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all duration-1000 card-hover-orange hover:scale-105 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-500 text-lg">Shared with me</CardTitle>
              <CardDescription className="text-orange-500 text-2xl font-bold">{initialSharedCount}</CardDescription>
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUpdate(true)
                    }
                  }}
                  placeholder="Search across all your data by title..."
                  autoComplete="off"
                  className="pl-10 pr-20 bg-slate-950/20 text-white focus:ring-cyan-500/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                  <button
                    type="button"
                    onClick={() => handleUpdate(true)}
                    className="p-1 text-cyan-500 hover:text-purple-500 transition-colors cursor-pointer"
                    title="Search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Clear"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
            </div>
            {isMounted && (
              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <Select value={searchCategory} onValueChange={setSearchCategory}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/20 text-white hover:cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
                    <SelectItem value="all" className="text-cyan-500 hover:text-white hover:cursor-pointer transition-colors">
                      All Items
                    </SelectItem>
                    <SelectItem value="notes" className="text-green-500 hover:text-white hover:cursor-pointer transition-colors">
                      Notes
                    </SelectItem>
                    <SelectItem value="urls" className="text-orange-500 hover:text-white hover:cursor-pointer transition-colors">
                      URLs
                    </SelectItem>
                    <SelectItem value="todos" className="text-cyan-500 hover:text-white hover:cursor-pointer transition-colors">
                      Todos
                    </SelectItem>
                    <SelectItem value="formulas" className="text-cyan-500 hover:text-white hover:cursor-pointer transition-colors">
                      Formulas
                    </SelectItem>
                    <SelectItem value="shortcuts" className="text-orange-500 hover:text-white hover:cursor-pointer transition-colors">
                      Shortcuts
                    </SelectItem>
                    <SelectItem value="new" className="text-pink-500 hover:text-white hover:cursor-pointer transition-colors">
                      New
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/20 text-white hover:cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
                    <SelectItem value="all" className="text-white hover:text-white hover:cursor-pointer transition-colors">
                      All
                    </SelectItem>
                    <SelectItem value="favorites" className="text-orange-500 hover:text-white hover:cursor-pointer transition-colors">
                      Favorites
                    </SelectItem>
                    <SelectItem value="unfavorites" className="text-green-500 hover:text-white hover:cursor-pointer transition-colors">
                      Unfavorites
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sharedFilter} onValueChange={setSharedFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/20 text-white hover:cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
                    <SelectItem value="all" className="text-white hover:text-white hover:cursor-pointer transition-colors">
                      All Items
                    </SelectItem>
                    <SelectItem value="shared" className="text-indigo-500 hover:text-white hover:cursor-pointer transition-colors">
                      Shared
                    </SelectItem>
                    <SelectItem value="unshare" className="text-red-500 hover:text-white hover:cursor-pointer transition-colors">
                      Unshare
                    </SelectItem>
                    <SelectItem value="received" className="text-green-500 hover:text-white hover:cursor-pointer transition-colors">
                      Received
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(searchQuery || hasSearched || isLoading) && (
        <div className="space-y-8">
          {isLoading && <SearchingLoader />}

          {!isLoading && (
            <>
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

              {searchResults.notes.length === 0 &&
                searchResults.urls.length === 0 &&
                searchResults.todos.length === 0 &&
                searchResults.formulas.length === 0 &&
                searchResults.shortcuts.length === 0 && (
                  <p className="text-center text-red-500 py-8">No results found matching your search.</p>
                )}
            </>
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
          onOpenChange={handleFormClose}
          formula={editingItem.data}
          userId={userId}
        />
      )}
      {editingItem?.type === "shortcut" && (
        <ShortcutForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          shortcut={editingItem.data}
          userId={userId}
        />
      )}
      {editingItem?.type === "note" && (
        <NoteForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          note={editingItem.data}
          userId={userId}
        />
      )}
      {editingItem?.type === "url" && (
        <UrlForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          url={editingItem.data}
          userId={userId}
        />
      )}
      {editingItem?.type === "todo" && (
        <TodoForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          todo={editingItem.data}
          userId={userId}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
