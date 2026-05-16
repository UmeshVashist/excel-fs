"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, X } from "lucide-react"
import { ShortcutList } from "@/components/shortcut-list"
import { ShortcutForm } from "@/components/shortcut-form"
import { createClient } from "@/lib/supabase/client"
import { getBatchSharedWith } from "@/lib/sharing-actions"

interface Shortcut {
  id: string
  title: string
  description: string | null
  shortcut: string
  is_favorite: boolean
  user_id: string
  shared_permission?: "view" | "edit"
}

export function ShortcutsClient({
  initialShortcuts,
  userId,
  user,
}: {
  initialShortcuts: Shortcut[]
  userId: string
  user: any
}) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(initialShortcuts)
  const [filteredShortcuts, setFilteredShortcuts] = useState<Shortcut[]>(initialShortcuts)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null)
  const [sharesInfo, setSharesInfo] = useState<Record<string, any[]>>({})

  const supabase = createClient()

  // Sync state with props when server data refreshes
  useEffect(() => {
    setShortcuts(initialShortcuts)
  }, [initialShortcuts])

  useEffect(() => {
    loadShares()
  }, [shortcuts])

  const loadShares = async () => {
    const ownerShortcutIds = shortcuts
      .filter(s => s.user_id === userId)
      .map(s => s.id)
    
    if (ownerShortcutIds.length > 0) {
      const info = await getBatchSharedWith(ownerShortcutIds, "shortcuts")
      setSharesInfo(info)
    } else {
      setSharesInfo({})
    }
  }

  const loadShortcuts = async () => {
    try {
      // Fetch shortcuts where I am owner OR shared with me
      const { data: ownedData } = await supabase
        .from("shortcuts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })

      const { data: sharedItems, error: sharedError } = await supabase
        .from("shared_items")
        .select("resource_id, permission")
        .eq("shared_with_id", userId)
        .eq("resource_type", "shortcuts")

      if (sharedError && sharedError.code !== "PGRST205") throw sharedError

      let allShortcuts = ownedData || []

      if (sharedItems && sharedItems.length > 0) {
        const sharedIds = sharedItems.map(s => s.resource_id)
        const { data: sharedData } = await supabase
          .from("shortcuts")
          .select("*")
          .in("id", sharedIds)
          .eq("is_deleted", false)
        
        if (sharedData) {
          const sharedWithPermissions = sharedData.map(s => ({
            ...s,
            shared_permission: sharedItems.find(item => item.resource_id === s.id)?.permission
          }))
          allShortcuts = [...allShortcuts, ...sharedWithPermissions]
        }
      }

      setShortcuts(allShortcuts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch (error: any) {
      if (error.code !== "PGRST205") {
        console.error("Error loading shortcuts:", error)
      }
    }
  }

  useEffect(() => {
    let result = shortcuts

    // Apply search filter
    if (searchQuery) {
      result = result.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Apply favorite filter
    if (filter === "favorites") {
      result = result.filter((s) => s.is_favorite)
    } else if (filter === "unfavorites") {
      result = result.filter((s) => !s.is_favorite)
    } else if (filter === "shared") {
      result = result.filter((s) => sharesInfo[s.id] && sharesInfo[s.id].length > 0)
    }

    setFilteredShortcuts(result)
  }, [searchQuery, filter, shortcuts, sharesInfo])

  const handleAdd = () => {
    setEditingShortcut(null)
    setIsFormOpen(true)
  }

  const handleEdit = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingShortcut(null)
    loadShortcuts()
  }

  const handleUpdate = () => {
    loadShortcuts()
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">Shortcuts</h1>
          <p className="text-cyan-500">Manage your Excel keyboard shortcuts</p>
        </div>
        <Button
          onClick={handleAdd}
          className="btn-custom btn-custom-cyan w-full sm:w-auto px-5 h-9 text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Shortcut
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search shortcuts by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            className="pl-10 pr-10 bg-slate-900/50 border-slate-700 text-white"
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
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-900/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">
              All Shortcuts
            </SelectItem>
            <SelectItem value="favorites" className="text-white">
              Favorites
            </SelectItem>
            <SelectItem value="unfavorites" className="text-white">
              Unfavorites
            </SelectItem>
            <SelectItem value="shared" className="text-white">
              Shared
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ShortcutList shortcuts={filteredShortcuts} onEdit={handleEdit} onUpdate={handleUpdate} currentUserId={userId} sharesInfo={sharesInfo} />

      <ShortcutForm open={isFormOpen} onOpenChange={handleFormClose} shortcut={editingShortcut} userId={userId} />
    </div>
  )
}
