"use client"

import { useState } from "react"
import { Star, Edit2, Trash2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn, copyToClipboard } from "@/lib/utils"

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
    if (confirm("Are you sure you want to move this todo to Recycle Bin?")) {
      const { error } = await supabase
        .from("todos")
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq("id", todo.id)
      
      if (error) {
        console.error("Error moving todo to recycle bin:", error)
        alert("Failed to move item to recycle bin. Please check if the database columns exist.")
      } else {
        onUpdate()
        router.refresh()
      }
    }
  }

  const handleCopy = async () => {
    if (todo.description) {
      const success = await copyToClipboard(todo.description)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
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
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
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
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoriteToggle}
            className="btn-custom btn-custom-amber h-9 w-9 px-0 rounded-lg"
          >
            <Star className={cn("h-4 w-4 text-white", isFavorite && "fill-white")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(todo)}
            className="btn-custom btn-custom-purple h-9 w-9 px-0 rounded-lg"
          >
            <Edit2 className="h-4 w-4 text-white" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="btn-custom btn-custom-red h-9 w-9 px-0 rounded-lg"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
      {todo.description && (
        <div className="relative group">
          <div className="flex items-start gap-2">
            <div className="flex-1 bg-white/5 border border-white/10 rounded p-3 text-slate-300 text-sm whitespace-pre-wrap break-words">
              {todo.description}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="btn-custom btn-custom-cyan h-9 w-9 px-0 shrink-0 rounded-lg"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white" />}
            </Button>
          </div>
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
