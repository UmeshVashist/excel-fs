"use client"

import { useState } from "react"
import { Star, Edit2, Trash2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Todo {
  id: string
  title: string
  description: string | null
  status: "pending" | "in-progress" | "complete"
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export function TodoItem({
  todo,
  onEdit,
  onUpdate,
}: { todo: Todo; onEdit: (todo: Todo) => void; onUpdate: () => void }) {
  const [isFavorite, setIsFavorite] = useState(todo.is_favorite)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleFavoriteToggle = async () => {
    await supabase.from("todos").update({ is_favorite: !isFavorite }).eq("id", todo.id)
    setIsFavorite(!isFavorite)
    onUpdate()
    router.refresh()
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this todo?")) {
      await supabase.from("todos").delete().eq("id", todo.id)
      onUpdate()
      router.refresh()
    }
  }

  const handleCopy = async () => {
    if (todo.description) {
      await navigator.clipboard.writeText(todo.description)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-500 border-yellow-500"
      case "in-progress":
        return "text-blue-500 border-blue-500"
      case "complete":
        return "text-green-500 border-green-500"
      default:
        return "text-slate-500 border-slate-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "in-progress":
        return "In Progress"
      case "complete":
        return "Complete"
      default:
        return status
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">{todo.title}</h3>
          <div
            className={cn(
              "inline-block px-3 py-1 rounded-full text-sm font-medium border",
              getStatusColor(todo.status),
            )}
          >
            {getStatusLabel(todo.status)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoriteToggle}
            className={cn(
              "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 hover:border hover:border-yellow-600 transition-all",
              isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-yellow-500 hover:text-yellow-500",
            )}
          >
            <Star className={cn("h-5 w-5", isFavorite && "fill-yellow-500")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(todo)}
            className="text-blue-500 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-blue-500 hover:text-blue-500 hover:border hover:border-blue-500 transition-all"
          >
            <Edit2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-red-500 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-red-500 hover:text-red-500 hover:border hover:border-red-500 transition-all"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {todo.description && (
        <div className="relative group">
          <p className="text-slate-200 bg-white/5 p-4 rounded border border-white/10 backdrop-blur-xl\">{todo.description}</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 hover:border hover:border-blue-500 text-blue-500 hover:text-blue-500"
          >
            {copied ? <Check className="h-4 w-4 text-green-500  border border-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
