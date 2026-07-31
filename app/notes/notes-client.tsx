"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, X } from "lucide-react"
import { NotesList } from "@/components/notes-list"
import { NoteForm } from "@/components/note-form"
import { createClient } from "@/lib/supabase/client"
import { fetchItemsForUser } from "@/lib/supabase/user-helper"

import { getBatchSharedWith } from "@/lib/sharing-actions"
import { deleteItemAction, removeSharedItemAction, toggleFavoriteAction, getItemsAction } from "@/lib/item-actions"

import { ShareModal } from "@/components/share-modal"

interface Note {
  id: string
  title: string
  description: string | null
  is_favorite: boolean
  user_id: string
  shared_permission?: "view" | "edit"
}

export function NotesClient({
  initialNotes,
  userId,
  userIds,
  user,
}: {
  initialNotes: Note[]
  userId: string
  userIds?: string[]
  user: any
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [searchQuery, setSearchQuery] = useState("")
  const [favoriteFilter, setFavoriteFilter] = useState("all")
  const [sharedFilter, setSharedFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [sharesInfo, setSharesInfo] = useState<Record<string, any[]>>({})
  const lastFetchedIds = useRef<string>("")

  const [autoShareInfo, setAutoShareInfo] = useState<{ resourceId: string; resourceType: string } | null>(null)
  const [isAutoShareOpen, setIsAutoShareOpen] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const targetUserIds = useMemo(() => {
    const list = userIds && userIds.length > 0 ? userIds : [userId]
    if (user?.clerk_user_id && !list.includes(user.clerk_user_id)) list.push(user.clerk_user_id)
    return Array.from(new Set(list))
  }, [userId, userIds, user])

  // Sync state with props only when data actually changes
  useEffect(() => {
    if (JSON.stringify(initialNotes) !== JSON.stringify(notes)) {
      setNotes(initialNotes)
    }
  }, [initialNotes])

  useEffect(() => {
    const ownerNoteIds = notes
      .filter(n => n.user_id === userId)
      .map(n => n.id)
      .sort()
    
    const idsString = ownerNoteIds.join(",")
    if (idsString && idsString !== lastFetchedIds.current) {
      lastFetchedIds.current = idsString
      loadShares(ownerNoteIds)
    } else if (!idsString) {
      setSharesInfo({})
      lastFetchedIds.current = ""
    }
  }, [notes, userId])

  const loadShares = async (ids: string[]) => {
    try {
      const info = await getBatchSharedWith(ids, "notes")
      setSharesInfo(info)
    } catch (error) {
      console.error("Failed to load shares:", error)
    }
  }

  const checkIsOwner = (ownerId?: string | null) => {
    if (!ownerId) return true
    return ownerId === userId || targetUserIds.includes(ownerId) || (user?.clerk_user_id && ownerId === user.clerk_user_id)
  }

  const loadNotes = async () => {
    try {
      const { data: ownedData } = await getItemsAction("notes")
      if (ownedData) {
        setNotes(ownedData)
      }
    } catch (error: any) {
      if (error.code !== "PGRST205") {
        console.error("Error loading notes:", error)
      }
    }
  }


  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => checkIsOwner(n.user_id) || checkIsOwner((n as any).clerk_user_id))

    // Apply search filter
    if (searchQuery) {
      result = result.filter((n) => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply favorite filter
    if (favoriteFilter === "favorites") {
      result = result.filter((n) => n.is_favorite)
    } else if (favoriteFilter === "unfavorites") {
      result = result.filter((n) => !n.is_favorite)
    }

    // Apply shared filter
    if (sharedFilter === "shared") {
      result = result.filter((n) => sharesInfo[n.id] && sharesInfo[n.id].length > 0)
    } else if (sharedFilter === "unshare") {
      result = result.filter((n) => !sharesInfo[n.id] || sharesInfo[n.id].length === 0)
    }

    return result
  }, [searchQuery, favoriteFilter, sharedFilter, notes, sharesInfo, userId, targetUserIds, user])

  const handleAdd = () => {
    setEditingNote(null)
    setIsFormOpen(true)
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingNote(null)
    loadNotes()
  }

  const handleAutoShare = (resourceId: string, resourceType: string) => {
    setAutoShareInfo({ resourceId, resourceType })
    setIsAutoShareOpen(true)
  }

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    await toggleFavoriteAction("notes", id, currentFavorite)
    loadNotes()
  }

  const handleDelete = async (id: string, ownerId: string) => {
    const isOwner = checkIsOwner(ownerId)

    if (isOwner) {
      if (confirm("Are you sure you want to move this note to Recycle Bin?")) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
        const res = await deleteItemAction("notes", id)
        if (res.success) {
          loadNotes()
        } else {
          console.error("Delete error:", res.error)
          loadNotes()
        }
      }
    } else {
      if (confirm("This item was shared with you. Are you sure you want to remove it from your list?")) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
        const res = await removeSharedItemAction(id, "notes")
        if (res.success) {
          loadNotes()
        } else {
          loadNotes()
        }
      }
    }
  }


  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">Notes</h1>
          <p className="text-cyan-500">Manage your notes</p>
        </div>
        <Button
          onClick={handleAdd}
          className="btn-custom btn-custom-cyan w-full sm:w-auto px-5 h-9 text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search notes by title..."
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
        <Select value={sharedFilter} onValueChange={setSharedFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-slate-900/60 backdrop-blur-md border-white/15 text-white hover:border-cyan-500/50 transition-all hover:cursor-pointer shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900/85 border-white/15 backdrop-blur-xl shadow-2xl">
            <SelectItem value="all" className="text-white hover:text-white cursor-pointer transition-colors">
              All Items
            </SelectItem>
            <SelectItem value="shared" className="text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">
              Shared
            </SelectItem>
            <SelectItem value="unshare" className="text-rose-400 hover:text-rose-300 cursor-pointer transition-colors">
              Unshare
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-slate-900/60 backdrop-blur-md border-white/15 text-white hover:border-cyan-500/50 transition-all hover:cursor-pointer shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900/85 border-white/15 backdrop-blur-xl shadow-2xl">
            <SelectItem value="all" className="text-white hover:text-white cursor-pointer transition-colors">
              All
            </SelectItem>
            <SelectItem value="favorites" className="text-amber-400 hover:text-amber-300 cursor-pointer transition-colors">
              Favorites
            </SelectItem>
            <SelectItem value="unfavorites" className="text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors">
              Unfavorites
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <NotesList 
        notes={filteredNotes} 
        onEdit={handleEdit} 
        onUpdate={loadNotes} 
        currentUserId={userId} 
        sharesInfo={sharesInfo}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
      />

      <NoteForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        note={editingNote}
        userId={userId}
        onSave={handleAutoShare}
      />

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
