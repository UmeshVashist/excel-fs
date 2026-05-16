"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, X } from "lucide-react"
import { NotesList } from "@/components/notes-list"
import { NoteForm } from "@/components/note-form"
import { createClient } from "@/lib/supabase/client"

interface Note {
  id: string
  title: string
  description: string | null
  is_favorite: boolean
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

  const supabase = createClient()

  // Sync state with props when server data refreshes
  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  const loadNotes = async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
    if (data) {
      setNotes(data)
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
    }

    setFilteredNotes(result)
  }, [searchQuery, filter, notes])

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
          </SelectContent>
        </Select>
      </div>

      <NotesList notes={filteredNotes} onEdit={handleEdit} onUpdate={handleUpdate} />

      <NoteForm open={isFormOpen} onOpenChange={handleFormClose} note={editingNote} userId={userId} />
    </div>
  )
}
