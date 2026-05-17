"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, X } from "lucide-react"
import { NotesList } from "@/components/notes-list"
import { NoteForm } from "@/components/note-form"
import { createClient } from "@/lib/supabase/client"
import { getBatchSharedWith } from "@/lib/sharing-actions"

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
  user,
}: {
  initialNotes: Note[]
  userId: string
  user: any
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [searchQuery, setSearchQuery] = useState("")
  const [favoriteFilter, setFavoriteFilter] = useState("all")
  const [sharedFilter, setSharedFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [sharesInfo, setSharesInfo] = useState<Record<string, any[]>>({})

  const supabase = useMemo(() => createClient(), [])

  // Sync state with props when server data refreshes
  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  useEffect(() => {
    loadShares()
  }, [notes])

  const loadShares = async () => {
    const ownerNoteIds = notes
      .filter(n => n.user_id === userId)
      .map(n => n.id)
    
    if (ownerNoteIds.length > 0) {
      const info = await getBatchSharedWith(ownerNoteIds, "notes")
      setSharesInfo(info)
    } else {
      setSharesInfo({})
    }
  }

  const loadNotes = async () => {
    try {
      // Fetch only owned notes
      const { data: ownedData } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })

      setNotes(ownedData || [])
    } catch (error) {
      console.error("Error loading notes:", error)
    }
  }

  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => n.user_id === userId)

    if (searchQuery) {
      result = result.filter((n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (favoriteFilter === "favorites") {
      result = result.filter((n) => n.is_favorite)
    } else if (favoriteFilter === "unfavorites") {
      result = result.filter((n) => !n.is_favorite)
    }

    if (sharedFilter === "shared") {
      result = result.filter((n) => sharesInfo[n.id] && sharesInfo[n.id].length > 0)
    } else if (sharedFilter === "unshare") {
      result = result.filter((n) => !sharesInfo[n.id] || sharesInfo[n.id].length === 0)
    }

    return result
  }, [notes, searchQuery, favoriteFilter, sharedFilter, sharesInfo, userId])

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

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    const { error } = await supabase.from("notes").update({ is_favorite: !currentFavorite }).eq("id", id)
    if (!error) {
      loadNotes()
    }
  }

  const handleDelete = async (id: string, ownerId: string) => {
    const isOwner = ownerId === userId

    if (isOwner) {
      if (confirm("Are you sure you want to move this note to Recycle Bin?")) {
        const { error } = await supabase
          .from("notes")
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString() 
          })
          .eq("id", id)
        
        if (!error) {
          loadNotes()
        }
      }
    } else {
      if (confirm("This item was shared with you. Are you sure you want to remove it from your list?")) {
        const { error } = await supabase
          .from("shared_items")
          .delete()
          .eq("resource_id", id)
          .eq("shared_with_id", userId)
          .eq("resource_type", "notes")
        
        if (!error) {
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
          <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/20 text-white hover:cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
            <SelectItem value="all" className="text-white hover:text-white cursor-pointer transition-colors">
              All Items
            </SelectItem>
            <SelectItem value="shared" className="text-indigo-500 hover:text-white cursor-pointer transition-colors">
              Shared
            </SelectItem>
            <SelectItem value="unshare" className="text-red-500 hover:text-white cursor-pointer transition-colors">
              Unshare
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/20 text-white hover:cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
            <SelectItem value="all" className="text-white hover:text-white cursor-pointer transition-colors">
              All
            </SelectItem>
            <SelectItem value="favorites" className="text-orange-500 hover:text-white cursor-pointer transition-colors">
              Favorites
            </SelectItem>
            <SelectItem value="unfavorites" className="text-green-500 hover:text-white cursor-pointer transition-colors">
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

      <NoteForm open={isFormOpen} onOpenChange={handleFormClose} note={editingNote} userId={userId} />
    </div>
  )
}
