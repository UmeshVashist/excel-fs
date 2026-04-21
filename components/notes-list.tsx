"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Trash2, Edit, Copy, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface Note {
  id: string
  title: string
  description: string | null
  is_favorite: boolean
}

export function NotesList({
  notes,
  onEdit,
  onUpdate,
}: {
  notes: Note[]
  onEdit: (note: Note) => void
  onUpdate: () => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    const { error } = await supabase.from("notes").update({ is_favorite: !currentFavorite }).eq("id", id)
    if (!error) {
      onUpdate()
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      const { error } = await supabase.from("notes").delete().eq("id", id)
      if (!error) {
        onUpdate()
        router.refresh()
      }
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No notes found. Add your first note to get started!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {notes.map((note) => (
        <Card key={note.id} className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-white flex items-center gap-2">
                  {note.title}
                  {note.is_favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleToggleFavorite(note.id, note.is_favorite)}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-yellow-500 hover:text-yellow-500 hover:border hover:border-yellow-500"
                >
                  <Star className={note.is_favorite ? "fill-yellow-400 text-yellow-400" : ""} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(note)}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-blue-500 hover:text-blue-500 hover:border hover:border-blue-500"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(note.id)}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-red-500 hover:text-red-500 hover:border hover:border-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {note.description && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(note.id, note.description || "")}
                    className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-blue-500 hover:text-blue-500 hover:border hover:border-blue-500"
                  >
                    {copiedId === note.id ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          {note.description && (
            <CardContent>
              <div className="block p-3 bg-white/5 rounded border border-white/10 text-slate-200 text-sm overflow-x-auto overflow-y-auto whitespace-pre-wrap max-h-[5.6rem] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {note.description}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
