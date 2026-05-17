"use client"

import { useState, useEffect, useMemo } from "react"
import { Star, Edit2, Trash2, Copy, Check, Share2, History, Users, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn, copyToClipboard } from "@/lib/utils"
import { ShareModal } from "./share-modal"
import { HistoryModal } from "./history-modal"
import { getSharedWith } from "@/lib/sharing-actions"

import { format } from "date-fns"

interface Todo {
  id: string
  title: string
  description: string | null
  remark?: string | null
  status: "pending" | "in-process" | "complete"
  is_favorite: boolean
  user_id: string
  shared_permission?: "view" | "edit"
  created_at: string
  updated_at: string
  received_at?: string
}

const EMPTY_SHARES: any[] = []

export function TodoItem({
  todo,
  onEdit,
  onUpdate,
  currentUserId,
  initialShares = EMPTY_SHARES,
}: { 
  todo: Todo; 
  onEdit: (todo: Todo) => void; 
  onUpdate: () => void;
  currentUserId: string;
  initialShares?: any[];
}) {
  const [isFavorite, setIsFavorite] = useState(todo.is_favorite)
  const [copied, setCopied] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [shares, setShares] = useState<any[]>(initialShares)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const isOwner = todo.user_id === currentUserId
  const canEdit = isOwner || todo.shared_permission === "edit"

  // Update local shares when initialShares prop changes
  useEffect(() => {
    setShares(initialShares)
  }, [initialShares])

  const handleFavoriteToggle = async () => {
    await supabase.from("todos").update({ is_favorite: !isFavorite }).eq("id", todo.id)
    setIsFavorite(!isFavorite)
    onUpdate()
  }

  const handleDelete = async () => {
    if (isOwner) {
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
          alert("Failed to move item to recycle bin.")
        } else {
          onUpdate()
        }
      }
    } else {
      if (confirm("This item was shared with you. Are you sure you want to remove it from your list?")) {
        const { error } = await supabase
          .from("shared_items")
          .delete()
          .eq("resource_id", todo.id)
          .eq("shared_with_id", currentUserId)
        
        if (!error) {
          onUpdate()
        }
      }
    }
  }

  const handleStatusChange = async (newStatus: "pending" | "in-process" | "complete") => {
    const { error } = await supabase.from("todos").update({ status: newStatus }).eq("id", todo.id)
    if (!error) {
      onUpdate()
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
      case "in-process":
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
      case "in-process":
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
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-white break-words">{todo.title}</h3>
            {!isOwner && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                <Users className="h-2.5 w-2.5" />
                Shared
              </span>
            )}
          </div>
          <div
            className={cn(
              "inline-block px-3 py-1 rounded-full text-sm font-medium border shrink-0",
              getStatusColor(todo.status),
            )}
          >
            {getStatusLabel(todo.status)}
          </div>

          {isOwner && shares.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Shared with:</span>
              <div className="flex -space-x-2 overflow-hidden">
                {shares.slice(0, 3).map((share: any) => (
                  <div 
                    key={share.id} 
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-800 flex items-center justify-center border border-slate-700"
                    title={`${share.profiles?.username || share.profiles?.email} (${share.permission})`}
                  >
                    <User className="h-3 w-3 text-slate-400" />
                  </div>
                ))}
                {shares.length > 3 && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-800 border border-slate-700 text-[10px] text-slate-400">
                    +{shares.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {todo.received_at && (
            <span className="text-[10px] text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Received on: {format(new Date(todo.received_at), "MMM d, yyyy h:mm a")}
            </span>
          )}
          <div className="flex items-center gap-2">
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
              onClick={() => setHistoryModalOpen(true)}
              className="btn-custom btn-custom-cyan h-9 w-9 px-0 rounded-lg"
            >
              <History className="h-4 w-4 text-white" />
            </Button>

            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShareModalOpen(true)}
                className="btn-custom btn-custom-cyan h-9 w-9 px-0 rounded-lg"
              >
                <Share2 className="h-4 w-4 text-white" />
              </Button>
            )}

            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(todo)}
                className="btn-custom btn-custom-purple h-9 w-9 px-0 rounded-lg"
              >
                <Edit2 className="h-4 w-4 text-white" />
              </Button>
            )}

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
      {(todo.remark || todo.status === "pending") && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Remark</p>
          <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{todo.remark || "No remark available"}</p>
        </div>
      )}

      {isOwner && (
        <ShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          resourceId={todo.id}
          resourceType="todos"
          ownerId={todo.user_id}
        />
      )}
      <HistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        resourceId={todo.id}
        resourceType="todos"
      />
    </div>
  )
}
