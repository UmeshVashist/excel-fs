"use client"

import { useEffect, useState } from "react"
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
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(initialNotes)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [sharesInfo, setSharesInfo] = useState<Record<string, any[]>>({})

  const supabase = createClient()

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
      // Fetch notes where I am owner OR shared with me
      const { data: ownedData } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })

      const { data: sharedItems, error: sharedError } = await supabase
        .from("shared_items")
        .select("resource_id, permission")
        .eq("shared_with_id", userId)
        .eq("resource_type", "notes")

      if (sharedError && sharedError.code !== "PGRST205") throw sharedError

      let allNotes = ownedData || []

      if (sharedItems && sharedItems.length > 0) {
        const sharedIds = sharedItems.map(s => s.resource_id)
        const { data: sharedData } = await supabase
          .from("notes")
          .select("*")
          .in("id", sharedIds)
          .eq("is_deleted", false)
        
        if (sharedData) {
          const sharedWithPermissions = sharedData.map(n => ({
            ...n,
            shared_permission: sharedItems.find(item => item.resource_id === n.id)?.permission
          }))
          allNotes = [...allNotes, ...sharedWithPermissions]
        }
      }

      setNotes(allNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch (error: any) {
      if (error.code !== "PGRST205") {
        console.error("Error loading notes:", error)
      }
    }
  }

  useEffect(() => {
    let result = notes

    // Apply search filter
    if (searchQuery) {
      result = result.filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Apply favorite filter
    if (filter === "favorites") {
      result = result.filter((n) => n.is_favorite)
    } else if (filter === "unfavorites") {
      result = result.filter((n) => !n.is_favorite)
    } else if (filter === "shared") {
      result = result.filter((n) => sharesInfo[n.id] && sharesInfo[n.id].length > 0)
    }

    setFilteredNotes(result)
  }, [searchQuery, filter, notes, sharesInfo])

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

  const handleUpdate = () => {
    loadNotes()
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
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-900/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">
              All Notes
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

      <NotesList notes={filteredNotes} onEdit={handleEdit} onUpdate={handleUpdate} currentUserId={userId} sharesInfo={sharesInfo} />

      <NoteForm open={isFormOpen} onOpenChange={handleFormClose} note={editingNote} userId={userId} />
    </div>
  )
}
