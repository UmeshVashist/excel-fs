"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Trash2, Edit, Copy, Check, Share2, History, Users, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { copyToClipboard } from "@/lib/utils"
import { ShareModal } from "./share-modal"
import { HistoryModal } from "./history-modal"
import { getBatchSharedWith } from "@/lib/sharing-actions"

import { format } from "date-fns"

interface Note {
  id: string
  title: string
  description: string | null
  is_favorite: boolean
  user_id: string
  shared_permission?: "view" | "edit"
  received_at?: string
}

export function NotesList({
  notes,
  onEdit,
  onUpdate,
  currentUserId,
  sharesInfo: externalSharesInfo,
  onToggleFavorite,
  onDelete,
}: {
  notes: Note[]
  onEdit: (note: Note) => void
  onUpdate: () => void
  currentUserId: string
  sharesInfo?: Record<string, any[]>
  onToggleFavorite?: (id: string, currentFavorite: boolean) => Promise<void>
  onDelete?: (id: string, ownerId: string) => Promise<void>
}) {
  const router = useRouter()
  const supabase = createClient()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null)
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const [sharesInfo, setSharesInfo] = useState<Record<string, any[]>>(externalSharesInfo || {})

  useEffect(() => {
    if (externalSharesInfo) {
      setSharesInfo(externalSharesInfo)
    } else {
      loadAllShares()
    }
  }, [notes, externalSharesInfo])

  const loadAllShares = async () => {
    const ownerNoteIds = notes
      .filter(n => n.user_id === currentUserId)
      .map(n => n.id)
    
    if (ownerNoteIds.length > 0) {
      const info = await getBatchSharedWith(ownerNoteIds, "notes")
      setSharesInfo(info)
    } else {
      setSharesInfo({})
    }
  }

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    if (onToggleFavorite) {
      await onToggleFavorite(id, currentFavorite)
      return
    }

    const { error } = await supabase.from("notes").update({ is_favorite: !currentFavorite }).eq("id", id)
    if (!error) {
      onUpdate()
    }
  }

  const handleDelete = async (id: string, ownerId: string) => {
    if (onDelete) {
      await onDelete(id, ownerId)
      return
    }

    const isOwner = ownerId === currentUserId

    if (isOwner) {
      if (confirm("Are you sure you want to delete this note?")) {
        const { error } = await supabase.from("notes").update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq("id", id)
        if (!error) {
          onUpdate()
        }
      }
    } else {
      if (confirm("This item was shared with you. Are you sure you want to remove it from your list?")) {
        const { error } = await supabase
          .from("shared_items")
          .delete()
          .eq("resource_id", id)
          .eq("shared_with_id", currentUserId)
          .eq("resource_type", "notes")
        
        if (!error) {
          onUpdate()
        }
      }
    }
  }

  const handleShareClick = (note: Note) => {
    setSelectedResourceId(note.id)
    setSelectedOwnerId(note.user_id)
    setShareModalOpen(true)
  }

  const handleHistoryClick = (note: Note) => {
    setSelectedResourceId(note.id)
    setHistoryModalOpen(true)
  }

  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
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
      {notes.map((note) => {
        const isOwner = note.user_id === currentUserId
        const canEdit = isOwner || note.shared_permission === "edit"
        const shares = sharesInfo[note.id] || []

        return (
          <Card key={note.id} className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-white flex items-center gap-2 flex-wrap text-lg">
                    {note.title}
                    {note.is_favorite && <Star className="h-4 w-4 fill-white text-white shrink-0" />}
                    {!isOwner && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" />
                        Shared
                      </span>
                    )}
                  </CardTitle>
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
                  {note.received_at && (
                    <span className="text-[10px] text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      Received on: {format(new Date(note.received_at), "MMM d, yyyy h:mm a")}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
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

                    {isOwner && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleShareClick(note)}
                        className="btn-custom btn-custom-cyan h-9 w-9 px-0 rounded-lg"
                      >
                        <Share2 className="h-4 w-4 text-white" />
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleHistoryClick(note)}
                      className="btn-custom btn-custom-cyan h-9 w-9 px-0 rounded-lg"
                    >
                      <History className="h-4 w-4 text-white" />
                    </Button>

                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEdit(note)}
                        className="btn-custom btn-custom-purple h-9 w-9 px-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(note.id, note.user_id)}
                      className="btn-custom btn-custom-red h-9 w-9 px-0 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </div>
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
        )
      })}

      {selectedResourceId && (
        <>
          <ShareModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            resourceId={selectedResourceId}
            resourceType="notes"
            ownerId={selectedOwnerId!}
          />
          <HistoryModal
            open={historyModalOpen}
            onOpenChange={setHistoryModalOpen}
            resourceId={selectedResourceId}
            resourceType="notes"
          />
        </>
      )}
    </div>
  )
}
