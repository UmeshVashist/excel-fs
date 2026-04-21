"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus } from "lucide-react"
import { NotesList } from "@/components/notes-list"
import { NoteForm } from "@/components/note-form"
import { createClient } from "@/lib/supabase/client"
import { Suspense } from "react"
import { LoadingIcon } from "@/components/loading-icon"

interface Note {
  id: string
  title: string
  description: string | null
  is_favorite: boolean
}

export default function NotesPage() {
  return (
    <Suspense fallback={<LoadingIcon />}>
      <NotesContent />
    </Suspense>
  )
}

function NotesContent() {
  const [user, setUser] = useState<any>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push("/auth/login")
        return
      }
      setUser(currentUser)
      loadNotes(currentUser.id)
    }
    checkUser()
  }, [router, supabase])

  const loadNotes = async (userId: string) => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (data) {
      setNotes(data)
      setFilteredNotes(data)
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
    if (user) {
      loadNotes(user.id)
    }
  }

  const handleUpdate = () => {
    if (user) {
      loadNotes(user.id)
    }
  }

  if (!user) return null

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">Notes</h1>
          <p className="text-cyan-500">Manage your notes</p>
        </div>
        <Button
          onClick={handleAdd}
          className="w-full md:w-auto bg-slate-950/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-blue-600/50"
        >
          <Plus className="mr-2 h-4 w-4" />
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
            className="pl-10 bg-slate-900/50 border-slate-700 text-white"
          />
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
          </SelectContent>
        </Select>
      </div>

      <NotesList notes={filteredNotes} onEdit={handleEdit} onUpdate={handleUpdate} />

      <NoteForm open={isFormOpen} onOpenChange={handleFormClose} note={editingNote} userId={user.id} />
    </div>
  )
}
