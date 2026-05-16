"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Trash2, Edit, Copy, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { copyToClipboard } from "@/lib/utils"

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
    if (confirm("Are you sure you want to move this note to Recycle Bin?")) {
      const { error } = await supabase
        .from("notes")
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq("id", id)
      
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-white flex items-center gap-2 flex-wrap text-lg">
                  {note.title}
                  {note.is_favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleToggleFavorite(note.id, note.is_favorite)}
                  className="btn-custom btn-custom-amber h-9 w-9 px-0 rounded-lg"
                >
                  <Star className={note.is_favorite ? "fill-white text-white h-4 w-4" : "h-4 w-4 text-white"} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleCopy(note.id, note.description || "")}
                  className="btn-custom btn-custom-cyan h-9 w-9 px-0 rounded-lg"
                >
                  {copiedId === note.id ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(note)}
                  className="btn-custom btn-custom-purple h-9 w-9 px-0 rounded-lg"
                >
                  <Edit className="h-4 w-4 text-white" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(note.id)}
                  className="btn-custom btn-custom-red h-9 w-9 px-0 rounded-lg"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {note.description && (
            <CardContent>
              <div className="relative group">
                <div className="flex items-start gap-2">
                  <div className="flex-1 block p-3 bg-white/5 rounded border border-white/10 text-slate-200 text-sm overflow-y-auto whitespace-pre-wrap break-words max-h-[8rem] sm:max-h-[12rem] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {note.description}
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
