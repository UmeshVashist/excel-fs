"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Trash2, Edit, Copy, Check, Share2, History, Users, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { copyToClipboard } from "@/lib/utils"
import { ShareModal } from "./share-modal"
import { HistoryModal } from "./history-modal"
import { getBatchSharedWith } from "@/lib/sharing-actions"

interface Shortcut {
  id: string
  title: string
  description: string | null
  shortcut: string
  is_favorite: boolean
  user_id: string
  shared_permission?: "view" | "edit"
}

export function ShortcutList({
  shortcuts,
  onEdit,
  onUpdate,
  currentUserId,
  sharesInfo: externalSharesInfo,
}: {
  shortcuts: Shortcut[]
  onEdit: (shortcut: Shortcut) => void
  onUpdate: () => void
  currentUserId: string
  sharesInfo?: Record<string, any[]>
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
  }, [shortcuts, externalSharesInfo])

  const loadAllShares = async () => {
    const ownerShortcutIds = shortcuts
      .filter(s => s.user_id === currentUserId)
      .map(s => s.id)
    
    if (ownerShortcutIds.length > 0) {
      const info = await getBatchSharedWith(ownerShortcutIds, "shortcuts")
      setSharesInfo(info)
    } else {
      setSharesInfo({})
    }
  }

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    const { error } = await supabase.from("shortcuts").update({ is_favorite: !currentFavorite }).eq("id", id)
    if (!error) {
      onUpdate()
      router.refresh()
    }
  }

  const handleDelete = async (id: string, ownerId: string) => {
    const isOwner = ownerId === currentUserId

    if (isOwner) {
      if (confirm("Are you sure you want to move this shortcut to Recycle Bin?")) {
        const { error } = await supabase
          .from("shortcuts")
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
    } else {
      if (confirm("This item was shared with you. Are you sure you want to remove it from your list?")) {
        const { error } = await supabase
          .from("shared_items")
          .delete()
          .eq("resource_id", id)
          .eq("shared_with_id", currentUserId)
        
        if (!error) {
          onUpdate()
          router.refresh()
        }
      }
    }
  }

  const handleShareClick = (shortcut: Shortcut) => {
    setSelectedResourceId(shortcut.id)
    setSelectedOwnerId(shortcut.user_id)
    setShareModalOpen(true)
  }

  const handleHistoryClick = (shortcut: Shortcut) => {
    setSelectedResourceId(shortcut.id)
    setHistoryModalOpen(true)
  }

  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  if (shortcuts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No shortcuts found. Add your first shortcut to get started!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {shortcuts.map((shortcut) => {
        const isOwner = shortcut.user_id === currentUserId
        const canEdit = isOwner || shortcut.shared_permission === "edit"
        const shares = sharesInfo[shortcut.id] || []

        return (
          <Card key={shortcut.id} className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-white flex items-center gap-2 flex-wrap text-lg">
                    {shortcut.title}
                    {shortcut.is_favorite && <Star className="h-4 w-4 fill-white text-white shrink-0" />}
                    {!isOwner && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" />
                        Shared
                      </span>
                    )}
                  </CardTitle>
                  {shortcut.description && (
                    <CardDescription className="text-slate-300 mt-1 line-clamp-1">{shortcut.description}</CardDescription>
                  )}
                  {isOwner && shares.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {shares.map((share: any) => (
                        <div key={share.id} className="text-[10px] text-slate-400 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                          <User className="h-2 w-2" />
                          {share.profiles?.username || share.profiles?.email}
                          <span className="text-slate-600">({share.permission})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleToggleFavorite(shortcut.id, shortcut.is_favorite)}
                    className="btn-custom btn-custom-amber h-9 w-9 px-0 rounded-lg"
                  >
                    <Star className={shortcut.is_favorite ? "fill-white text-white h-4 w-4" : "h-4 w-4 text-white"} />
                  </Button>
                  
                  {isOwner && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleShareClick(shortcut)}
                      className="btn-custom btn-custom-cyan h-9 w-9 px-0 rounded-lg"
                    >
                      <Share2 className="h-4 w-4 text-white" />
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleHistoryClick(shortcut)}
                    className="btn-custom btn-custom-cyan h-9 w-9 px-0 rounded-lg"
                  >
                    <History className="h-4 w-4 text-white" />
                  </Button>

                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(shortcut)}
                      className="btn-custom btn-custom-purple h-9 w-9 px-0 rounded-lg"
                    >
                      <Edit className="h-4 w-4 text-white" />
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(shortcut.id, shortcut.user_id)}
                    className="btn-custom btn-custom-red h-9 w-9 px-0 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative group">
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-white/5 rounded border border-white/10 text-blue-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap break-all min-h-[3rem]">
                    {shortcut.shortcut}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(shortcut.id, shortcut.shortcut)}
                    className="btn-custom btn-custom-cyan h-9 w-9 px-0 shrink-0 rounded-lg"
                  >
                    {copiedId === shortcut.id ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-white" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {selectedResourceId && (
        <>
          <ShareModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            resourceId={selectedResourceId}
            resourceType="shortcuts"
            ownerId={selectedOwnerId!}
          />
          <HistoryModal
            open={historyModalOpen}
            onOpenChange={setHistoryModalOpen}
            resourceId={selectedResourceId}
            resourceType="shortcuts"
          />
        </>
      )}
    </div>
  )
}
