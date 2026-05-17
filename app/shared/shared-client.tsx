"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassBackground } from "@/components/glass-background"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X, Users, Loader2 } from "lucide-react"
import { FormulaList } from "@/components/formula-list"
import { ShortcutList } from "@/components/shortcut-list"
import { NotesList } from "@/components/notes-list"
import { UrlsList } from "@/components/urls-list"
import { TodoItem } from "@/components/todo-item"
import { getBatchSharedWith } from "@/lib/sharing-actions"

import { ShortcutForm } from "@/components/shortcut-form"
import { NoteForm } from "@/components/note-form"
import { UrlForm } from "@/components/url-form"
import { TodoForm } from "@/components/todo-form"

export default function SharedClient({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [favoriteFilter, setFavoriteFilter] = useState("all")
  const [items, setItems] = useState<any>({
    formulas: [],
    shortcuts: [],
    notes: [],
    urls: [],
    todos: [],
    sharesInfo: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<{ type: string; data: any } | null>(null)

  const loadSharedItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: sharedItems, error: sharedError } = await supabase
        .from("shared_items")
        .select("resource_id, resource_type, permission, created_at")
        .eq("shared_with_id", userId)

      if (sharedError) throw sharedError

      const results: any = { formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} }

      if (sharedItems && sharedItems.length > 0) {
        // Helper to fetch details for shared items
        const fetchDetails = async (type: string, table: string) => {
          const typeShares = sharedItems.filter(s => s.resource_type === type)
          if (typeShares.length === 0) return []
          
          const ids = typeShares.map(s => s.resource_id)
          const { data } = await supabase
            .from(table)
            .select("*")
            .in("id", ids)
            .eq("is_deleted", false)
          
          return (data || []).map(item => ({
            ...item,
            shared_permission: typeShares.find(s => s.resource_id === item.id)?.permission,
            received_at: typeShares.find(s => s.resource_id === item.id)?.created_at
          }))
        }

        const [formulas, shortcuts, notes, urls, todos] = await Promise.all([
          fetchDetails("formulas", "formulas"),
          fetchDetails("shortcuts", "shortcuts"),
          fetchDetails("notes", "notes"),
          fetchDetails("urls", "urls"),
          fetchDetails("todos", "todos")
        ])

        results.formulas = formulas
        results.shortcuts = shortcuts
        results.notes = notes
        results.urls = urls
        results.todos = todos

        // Shared view also needs to show who else it's shared with? 
        // Actually for shared view, we usually just show it's shared.
        // But let's fetch shares for todos anyway to be consistent.
        const todoIds = todos.map((t: any) => t.id)
        if (todoIds.length > 0) {
          results.sharesInfo = await getBatchSharedWith(todoIds, "todos")
        }
      }

      setItems(results)
    } catch (error: any) {
      if (error.code !== "PGRST205") {
        console.error("Error loading shared items:", error)
      }
      setItems({ formulas: [], shortcuts: [], notes: [], urls: [], todos: [], sharesInfo: {} })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userId])

  useEffect(() => {
    loadSharedItems()
  }, [loadSharedItems])

  const filterItems = (list: any[]) => {
    let result = list.filter(item => 
      (item.title || item.formula || item.shortcut || item.url || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )

    if (favoriteFilter === "favorites") {
      result = result.filter(item => item.is_favorite)
    } else if (favoriteFilter === "unfavorites") {
      result = result.filter(item => !item.is_favorite)
    }

    return result
  }

  const handleToggleFavorite = async (id: string, currentFavorite: boolean, type: string) => {
    const table = type === "urls" ? "urls" : type === "notes" ? "notes" : type === "shortcuts" ? "shortcuts" : "formulas"
    const { error } = await supabase.from(table).update({ is_favorite: !currentFavorite }).eq("id", id)
    if (!error) {
      loadSharedItems()
    }
  }

  const handleDelete = async (id: string, ownerId: string, type: string) => {
    // In shared view, users can only remove shared items from their list
    if (confirm("This item was shared with you. Are you sure you want to remove it from your list?")) {
      const { error } = await supabase
        .from("shared_items")
        .delete()
        .eq("resource_id", id)
        .eq("shared_with_id", userId)
        .eq("resource_type", type)
      
      if (!error) {
        loadSharedItems()
      }
    }
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingItem(null)
      loadSharedItems()
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-400" />
            Shared with Me
          </h1>
          <p className="text-slate-400 mt-1">Access items shared by other users.</p>
        </div>
      </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search shared items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-slate-900/50 border-slate-700 text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-950/20 text-white hover:cursor-pointer">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
                <SelectItem value="all" className="cursor-pointer text-white hover:text-white transition-colors">All Categories</SelectItem>
                <SelectItem value="formulas" className="cursor-pointer text-cyan-500 hover:text-white transition-colors">Formulas</SelectItem>
                <SelectItem value="shortcuts" className="cursor-pointer text-orange-500 hover:text-white transition-colors">Shortcuts</SelectItem>
                <SelectItem value="notes" className="cursor-pointer text-green-500 hover:text-white transition-colors">Notes</SelectItem>
                <SelectItem value="urls" className="cursor-pointer text-orange-500 hover:text-white transition-colors">URLs</SelectItem>
                <SelectItem value="todos" className="cursor-pointer text-cyan-500 hover:text-white transition-colors">Todos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-950/20 text-white hover:cursor-pointer">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
                <SelectItem value="all" className="cursor-pointer text-white hover:text-white transition-colors">All</SelectItem>
                <SelectItem value="favorites" className="cursor-pointer text-orange-500 hover:text-white transition-colors">Favorites</SelectItem>
                <SelectItem value="unfavorites" className="cursor-pointer text-green-500 hover:text-white transition-colors">Unfavorites</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-12">
            {(category === "all" || category === "formulas") && filterItems(items.formulas).length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-2">Formulas</h2>
                <FormulaList 
                  formulas={filterItems(items.formulas)} 
                  onEdit={(formula) => {
                    setEditingItem({ type: "formula", data: formula })
                    setIsFormOpen(true)
                  }}
                  onUpdate={loadSharedItems}
                  currentUserId={userId}
                  sharesInfo={items.sharesInfo}
                  onToggleFavorite={(id, fav) => handleToggleFavorite(id, fav, "formulas")}
                  onDelete={(id, owner) => handleDelete(id, owner, "formulas")}
                />
              </section>
            )}

            {(category === "all" || category === "shortcuts") && filterItems(items.shortcuts).length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-2">Shortcuts</h2>
                <ShortcutList 
                  shortcuts={filterItems(items.shortcuts)} 
                  onEdit={(shortcut) => {
                    setEditingItem({ type: "shortcut", data: shortcut })
                    setIsFormOpen(true)
                  }}
                  onUpdate={loadSharedItems}
                  currentUserId={userId}
                  sharesInfo={items.sharesInfo}
                  onToggleFavorite={(id, fav) => handleToggleFavorite(id, fav, "shortcuts")}
                  onDelete={(id, owner) => handleDelete(id, owner, "shortcuts")}
                />
              </section>
            )}

            {(category === "all" || category === "notes") && filterItems(items.notes).length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-2">Notes</h2>
                <NotesList 
                  notes={filterItems(items.notes)} 
                  onEdit={(note) => {
                    setEditingItem({ type: "note", data: note })
                    setIsFormOpen(true)
                  }}
                  onUpdate={loadSharedItems}
                  currentUserId={userId}
                  sharesInfo={items.sharesInfo}
                  onToggleFavorite={(id, fav) => handleToggleFavorite(id, fav, "notes")}
                  onDelete={(id, owner) => handleDelete(id, owner, "notes")}
                />
              </section>
            )}

            {(category === "all" || category === "urls") && filterItems(items.urls).length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-2">URLs</h2>
                <UrlsList 
                  urls={filterItems(items.urls)} 
                  onEdit={(url) => {
                    setEditingItem({ type: "url", data: url })
                    setIsFormOpen(true)
                  }}
                  onUpdate={loadSharedItems}
                  currentUserId={userId}
                  sharesInfo={items.sharesInfo}
                  onToggleFavorite={(id, fav) => handleToggleFavorite(id, fav, "urls")}
                  onDelete={(id, owner) => handleDelete(id, owner, "urls")}
                />
              </section>
            )}

            {(category === "all" || category === "todos") && filterItems(items.todos).length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-2">Todos</h2>
                <div className="grid gap-4">
                  {filterItems(items.todos).map((todo: any) => (
                    <TodoItem 
                      key={todo.id} 
                      todo={todo} 
                      onEdit={(todo) => {
                        setEditingItem({ type: "todo", data: todo })
                        setIsFormOpen(true)
                      }}
                      onUpdate={loadSharedItems}
                      currentUserId={userId}
                      initialShares={items.sharesInfo?.[todo.id] || []}
                    />
                  ))}
                </div>
              </section>
            )}

            {Object.values(items).every((arr: any) => arr.length === 0) && (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-400">No shared items found</h3>
                <p className="text-slate-500 mt-2">When someone shares data with you, it will appear here.</p>
              </div>
            )}
          </div>
        )}

      {editingItem && (
        <>
          {editingItem.type === "formula" && (
            <FormulaForm
              open={isFormOpen}
              onOpenChange={handleFormClose}
              formula={editingItem.data}
              userId={userId}
            />
          )}
          {editingItem.type === "shortcut" && (
            <ShortcutForm
              open={isFormOpen}
              onOpenChange={handleFormClose}
              shortcut={editingItem.data}
              userId={userId}
            />
          )}
          {editingItem.type === "note" && (
            <NoteForm
              open={isFormOpen}
              onOpenChange={handleFormClose}
              note={editingItem.data}
              userId={userId}
            />
          )}
          {editingItem.type === "url" && (
            <UrlForm
              open={isFormOpen}
              onOpenChange={handleFormClose}
              url={editingItem.data}
              userId={userId}
            />
          )}
          {editingItem.type === "todo" && (
            <TodoForm
              open={isFormOpen}
              onOpenChange={handleFormClose}
              todo={editingItem.data}
              userId={userId}
            />
          )}
        </>
      )}
    </div>
  )
}
