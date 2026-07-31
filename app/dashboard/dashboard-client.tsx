"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { fetchItemsForUser } from "@/lib/supabase/user-helper"
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
import { ShareModal } from "@/components/share-modal"
import { getDashboardItemsAction } from "@/lib/item-actions"


interface DashboardClientProps {
  userId: string
  userIds?: string[]
  initialFormulasCount: number
  initialShortcutsCount: number
  initialNotesCount: number
  initialUrlsCount: number
  initialTodosCount: number
  initialSharedCount: number
}

export function DashboardClient({
  userId,
  userIds,
  initialFormulasCount,
  initialShortcutsCount,
  initialNotesCount,
  initialUrlsCount,
  initialTodosCount,
  initialSharedCount
}: DashboardClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const searchParams = useSearchParams()

  const targetUserIds = useMemo(() => {
    const list = userIds && userIds.length > 0 ? userIds : [userId]
    return Array.from(new Set(list))
  }, [userId, userIds])

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
  const lastSearchKey = useRef<string>("")

  const [autoShareInfo, setAutoShareInfo] = useState<{ resourceId: string; resourceType: string } | null>(null)
  const [isAutoShareOpen, setIsAutoShareOpen] = useState(false)

  const handleUpdate = async (isManual = false) => {
    const searchKey = `${searchQuery}-${searchCategory}-${favoriteFilter}-${sharedFilter}`
    if (!isManual && searchKey === lastSearchKey.current) return
    lastSearchKey.current = searchKey

    setIsLoading(true)

    try {
      const res = await getDashboardItemsAction({
        searchQuery,
        searchCategory,
        favoriteFilter,
        sharedFilter,
      })

      if (res.data) {
        setSearchResults(res.data)
      }
    } catch (err) {
      console.error("Dashboard update error:", err)
    } finally {
      setIsLoading(false)
      setHasSearched(true)
    }
  }

  const handleEdit = (type: string, data: any) => {
    setEditingItem({ type, data })
    setIsFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingItem(null)
      handleUpdate(true) // Refresh data without full page reload
    }
  }

  const handleAutoShare = (resourceId: string, resourceType: string) => {
    setAutoShareInfo({ resourceId, resourceType })
    setIsAutoShareOpen(true)
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
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      const field = isUUID ? "id" : "clerk_user_id"

      const { data: profile } = await supabase
        .from("profiles")
        .select("password_set")
        .eq(field, userId)
        .maybeSingle()

      if (profile && profile.password_set === false) {
        setIsSetupPopupOpen(true)
      }
    }

    checkSetup()
  }, [searchParams, supabase, userId])

  useEffect(() => {
    const isUserFiltering =
      searchQuery.trim().length > 0 ||
      searchCategory !== "all" ||
      favoriteFilter !== "all" ||
      sharedFilter !== "all"

    if (!isUserFiltering) {
      setSearchResults({ formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} })
      setHasSearched(false)
      setIsLoading(false)
      return
    }

    const timer = setTimeout(() => {
      handleUpdate()
    }, 300)

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
        <Link href="/formulas" className="block h-full">
          <div className="relative overflow-hidden rounded-2xl p-[2px] transition-all duration-500 hover:scale-105 h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square rounded-full bg-[conic-gradient(from_0deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] animate-[border-spin_6s_linear_infinite] z-0 pointer-events-none" />
            <Card className="border text-center border-cyan-500/30 bg-slate-950/90 rounded-[14px] backdrop-blur-2xl card-hover-cyan h-full relative z-10">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-500 text-lg">Formulas</CardTitle>
                <CardDescription className="text-cyan-500 text-2xl font-bold">{initialFormulasCount}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Link>

        <Link href="/shortcuts" className="block h-full">
          <div className="relative overflow-hidden rounded-2xl p-[2px] transition-all duration-500 hover:scale-105 h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square rounded-full bg-[conic-gradient(from_0deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] animate-[border-spin_6s_linear_infinite] z-0 pointer-events-none" />
            <Card className="border text-center border-orange-500/30 bg-slate-950/90 rounded-[14px] backdrop-blur-2xl card-hover-orange h-full relative z-10">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-500 text-lg">Shortcuts</CardTitle>
                <CardDescription className="text-orange-500 text-2xl font-bold">{initialShortcutsCount}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Link>

        <Link href="/notes" className="block h-full">
          <div className="relative overflow-hidden rounded-2xl p-[2px] transition-all duration-500 hover:scale-105 h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square rounded-full bg-[conic-gradient(from_0deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] animate-[border-spin_6s_linear_infinite] z-0 pointer-events-none" />
            <Card className="border text-center border-cyan-500/30 bg-slate-950/90 rounded-[14px] backdrop-blur-2xl card-hover-cyan h-full relative z-10">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-500 text-lg">Notes</CardTitle>
                <CardDescription className="text-cyan-500 text-2xl font-bold">{initialNotesCount}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Link>

        <Link href="/urls" className="block h-full">
          <div className="relative overflow-hidden rounded-2xl p-[2px] transition-all duration-500 hover:scale-105 h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square rounded-full bg-[conic-gradient(from_0deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] animate-[border-spin_6s_linear_infinite] z-0 pointer-events-none" />
            <Card className="border text-center border-orange-500/30 bg-slate-950/90 rounded-[14px] backdrop-blur-2xl card-hover-orange h-full relative z-10">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-500 text-lg">URLs</CardTitle>
                <CardDescription className="text-orange-500 text-2xl font-bold">{initialUrlsCount}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Link>

        <Link href="/todos" className="block h-full">
          <div className="relative overflow-hidden rounded-2xl p-[2px] transition-all duration-500 hover:scale-105 h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square rounded-full bg-[conic-gradient(from_0deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] animate-[border-spin_6s_linear_infinite] z-0 pointer-events-none" />
            <Card className="border text-center border-cyan-500/30 bg-slate-950/90 rounded-[14px] backdrop-blur-2xl card-hover-cyan h-full relative z-10">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-500 text-lg">Todos</CardTitle>
                <CardDescription className="text-cyan-500 text-2xl font-bold">{initialTodosCount}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Link>

        <Link href="/shared" className="block h-full">
          <div className="relative overflow-hidden rounded-2xl p-[2px] transition-all duration-500 hover:scale-105 h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square rounded-full bg-[conic-gradient(from_0deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] animate-[border-spin_6s_linear_infinite] z-0 pointer-events-none" />
            <Card className="border text-center border-orange-500/30 bg-slate-950/90 rounded-[14px] backdrop-blur-2xl card-hover-orange h-full relative z-10">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-500 text-lg">Shared with me</CardTitle>
                <CardDescription className="text-orange-500 text-2xl font-bold">{initialSharedCount}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Link>
      </div>

      <Card className="rainbow-animated-border border text-center bg-slate-950/90 rounded-2xl backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
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
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-900/60 backdrop-blur-md border-white/15 text-white hover:border-cyan-500/50 transition-all hover:cursor-pointer shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/85 border-white/15 backdrop-blur-xl shadow-2xl">
                    <SelectItem value="all" className="text-cyan-400 hover:text-cyan-300 hover:cursor-pointer transition-colors">
                      All Items
                    </SelectItem>
                    <SelectItem value="notes" className="text-emerald-400 hover:text-emerald-300 hover:cursor-pointer transition-colors">
                      Notes
                    </SelectItem>
                    <SelectItem value="urls" className="text-amber-400 hover:text-amber-300 hover:cursor-pointer transition-colors">
                      URLs
                    </SelectItem>
                    <SelectItem value="todos" className="text-cyan-400 hover:text-cyan-300 hover:cursor-pointer transition-colors">
                      Todos
                    </SelectItem>
                    <SelectItem value="formulas" className="text-cyan-400 hover:text-cyan-300 hover:cursor-pointer transition-colors">
                      Formulas
                    </SelectItem>
                    <SelectItem value="shortcuts" className="text-amber-400 hover:text-amber-300 hover:cursor-pointer transition-colors">
                      Shortcuts
                    </SelectItem>
                    <SelectItem value="new" className="text-pink-400 hover:text-pink-300 hover:cursor-pointer transition-colors">
                      New
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-900/60 backdrop-blur-md border-white/15 text-white hover:border-cyan-500/50 transition-all hover:cursor-pointer shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/85 border-white/15 backdrop-blur-xl shadow-2xl">
                    <SelectItem value="all" className="text-white hover:text-white hover:cursor-pointer transition-colors">
                      All
                    </SelectItem>
                    <SelectItem value="favorites" className="text-amber-400 hover:text-amber-300 hover:cursor-pointer transition-colors">
                      Favorites
                    </SelectItem>
                    <SelectItem value="unfavorites" className="text-emerald-400 hover:text-emerald-300 hover:cursor-pointer transition-colors">
                      Unfavorites
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sharedFilter} onValueChange={setSharedFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-900/60 backdrop-blur-md border-white/15 text-white hover:border-cyan-500/50 transition-all hover:cursor-pointer shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/85 border-white/15 backdrop-blur-xl shadow-2xl">
                    <SelectItem value="all" className="text-white hover:text-white hover:cursor-pointer transition-colors">
                      All Items
                    </SelectItem>
                    <SelectItem value="shared" className="text-indigo-400 hover:text-indigo-300 hover:cursor-pointer transition-colors">
                      Shared
                    </SelectItem>
                    <SelectItem value="unshare" className="text-rose-400 hover:text-rose-300 hover:cursor-pointer transition-colors">
                      Unshare
                    </SelectItem>
                    <SelectItem value="received" className="text-emerald-400 hover:text-emerald-300 hover:cursor-pointer transition-colors">
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
          onSave={handleAutoShare}
        />
      )}
      {editingItem?.type === "shortcut" && (
        <ShortcutForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          shortcut={editingItem.data}
          userId={userId}
          onSave={handleAutoShare}
        />
      )}
      {editingItem?.type === "note" && (
        <NoteForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          note={editingItem.data}
          userId={userId}
          onSave={handleAutoShare}
        />
      )}
      {editingItem?.type === "url" && (
        <UrlForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          url={editingItem.data}
          userId={userId}
          onSave={handleAutoShare}
        />
      )}
      {editingItem?.type === "todo" && (
        <TodoForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          todo={editingItem.data}
          userId={userId}
          onUpdate={handleUpdate}
          onSave={handleAutoShare}
        />
      )}

      {autoShareInfo && (
        <ShareModal
          open={isAutoShareOpen}
          onOpenChange={setIsAutoShareOpen}
          resourceId={autoShareInfo.resourceId}
          resourceType={autoShareInfo.resourceType}
          ownerId={userId}
        />
      )}
    </div>
  )
}
