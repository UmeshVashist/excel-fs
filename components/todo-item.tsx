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
  remark?: string | null
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
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6 backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2 break-words">{todo.title}</h3>
          <div
            className={cn(
              "inline-block px-3 py-1 rounded-full text-sm font-medium border shrink-0",
              getStatusColor(todo.status),
            )}
          >
            {getStatusLabel(todo.status)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoriteToggle}
            className={cn(
              "h-9 w-9 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 hover:border hover:border-yellow-600 transition-all",
              isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-yellow-500 hover:text-yellow-500",
            )}
          >
            <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(todo)}
            className="h-9 w-9 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-blue-500 hover:text-blue-600 hover:border hover:border-blue-600 transition-all"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-9 w-9 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-red-500 hover:text-red-600 hover:border hover:border-red-600 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {todo.description && (
        <div className="relative group">
          <div className="bg-white/5 border border-white/10 rounded p-3 pr-12 text-slate-300 text-sm whitespace-pre-wrap break-words">
            {todo.description}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="absolute right-2 top-2 h-8 w-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-cyan-500 hover:text-cyan-600 hover:border hover:border-cyan-600 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}
      {todo.remark && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Remark</p>
          <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{todo.remark}</p>
        </div>
      )}
    </div>
  )
}
