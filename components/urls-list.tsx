"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Trash2, Edit, Copy, Check, Eye, EyeOff, Share2, History, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { copyToClipboard } from "@/lib/utils"
import { ShareModal } from "./share-modal"
import { HistoryModal } from "./history-modal"
import { getBatchSharedWith } from "@/lib/sharing-actions"

interface Url {
  id: string
  title: string
  url: string
  username: string | null
  password: string | null
  is_favorite: boolean
  user_id: string
  shared_permission?: "view" | "edit"
}

export function UrlsList({
  urls,
  onEdit,
  onUpdate,
  currentUserId,
  sharesInfo: externalSharesInfo,
}: {
  urls: Url[]
  onEdit: (url: Url) => void
  onUpdate: () => void
  currentUserId: string
  sharesInfo?: Record<string, any[]>
  onToggleFavorite?: (id: string, currentFavorite: boolean) => Promise<void>
  onDelete?: (id: string, ownerId: string) => Promise<void>
}) {
  const router = useRouter()
  const supabase = createClient()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string>("")
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
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
  }, [urls, externalSharesInfo])

  const loadAllShares = async () => {
    const ownerUrlIds = urls
      .filter(u => u.user_id === currentUserId)
      .map(u => u.id)
    
    if (ownerUrlIds.length > 0) {
      const info = await getBatchSharedWith(ownerUrlIds, "urls")
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

    const { error } = await supabase.from("urls").update({ is_favorite: !currentFavorite }).eq("id", id)
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
      if (confirm("Are you sure you want to move this URL to Recycle Bin?")) {
        const { error } = await supabase
          .from("urls")
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString() 
          })
          .eq("id", id)
        
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
          .eq("resource_type", "urls")
        
        if (!error) {
          onUpdate()
        }
      }
    }
  }

  const handleShareClick = (url: Url) => {
    setSelectedResourceId(url.id)
    setSelectedOwnerId(url.user_id)
    setShareModalOpen(true)
  }

  const handleHistoryClick = (url: Url) => {
    setSelectedResourceId(url.id)
    setHistoryModalOpen(true)
  }

  const handleCopy = async (id: string, text: string, field: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedId(id)
      setCopiedField(field)
      setTimeout(() => {
        setCopiedId(null)
        setCopiedField("")
      }, 2000)
    }
  }

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  if (urls.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No URLs found. Add your first URL to get started!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {urls.map((url) => {
        const isOwner = url.user_id === currentUserId
        const canEdit = isOwner || url.shared_permission === "edit"
        const shares = sharesInfo[url.id] || []

        return (
          <Card key={url.id} className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-white flex items-center gap-2 flex-wrap text-lg">
                    {url.title}
                    {url.is_favorite && <Star className="h-4 w-4 fill-white text-white shrink-0" />}
                    {!isOwner && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" />
                        Shared
                      </span>
                    )}
                  </CardTitle>
                  {isOwner && shares.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {shares.map((share: any) => (
                        <div key={share.id} className="text-[10px] text-slate-400 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                          <Users className="h-2 w-2" />
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
                    onClick={() => handleToggleFavorite(url.id, url.is_favorite)}
                    className="btn-custom btn-custom-amber h-9 w-9 px-0 rounded-lg"
                  >
                    <Star className={url.is_favorite ? "fill-white text-white h-4 w-4" : "h-4 w-4 text-white"} />
                  </Button>

                  {isOwner && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleShareClick(url)}
                      className="btn-custom btn-custom-cyan h-9 w-9 px-0 rounded-lg"
                    >
                      <Share2 className="h-4 w-4 text-white" />
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleHistoryClick(url)}
                    className="btn-custom btn-custom-cyan h-9 w-9 px-0 rounded-lg"
                  >
                    <History className="h-4 w-4 text-white" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => togglePasswordVisibility(url.id)}
                    className="btn-custom btn-custom-purple h-9 w-9 px-0 rounded-lg"
                  >
                    {visiblePasswords.has(url.id) ? <EyeOff className="h-4 w-4 text-white" /> : <Eye className="h-4 w-4 text-white" />}
                  </Button>

                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(url)}
                      className="btn-custom btn-custom-purple h-9 w-9 px-0 rounded-lg"
                    >
                      <Edit className="h-4 w-4 text-white" />
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(url.id, url.user_id)}
                    className="btn-custom btn-custom-red h-9 w-9 px-0 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-slate-300 text-xs uppercase tracking-wide">URL</span>
                <div className="flex items-center gap-2">
                  <a
                    href={url.url.startsWith("http") ? url.url : `https://${url.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 block p-2 bg-white/5 rounded border border-white/10 text-blue-400 text-sm break-all hover:bg-white/10 hover:text-blue-300 transition-colors"
                  >
                    {url.url}
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(url.id, url.url, "url")}
                    className="btn-custom btn-custom-cyan h-9 w-9 px-0 shrink-0 rounded-lg"
                  >
                    {copiedId === url.id && copiedField === "url" ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-white" />
                    )}
                  </Button>
                </div>
              </div>

              {url.username && (
                <div className="space-y-2">
                  <span className="text-slate-300 text-xs uppercase tracking-wide">Username</span>
                  <div className="relative group">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 block p-2 bg-white/5 rounded border border-white/10 text-slate-200 text-sm break-all">
                        {visiblePasswords.has(url.id) ? url.username : "••••••••"}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCopy(url.id, url.username || "", "username")}
                        className="btn-custom btn-custom-cyan h-9 w-9 px-0 shrink-0 rounded-lg"
                      >
                        {copiedId === url.id && copiedField === "username" ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-white" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {url.password && (
                <div className="space-y-2">
                  <span className="text-slate-300 text-xs uppercase tracking-wide">Password</span>
                  <div className="relative group">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 block p-2 bg-white/5 rounded border border-white/10 text-slate-200 text-sm break-all font-mono">
                        {visiblePasswords.has(url.id) ? url.password : "••••••••"}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCopy(url.id, url.password || "", "password")}
                        className="btn-custom btn-custom-cyan h-9 w-9 px-0 shrink-0 rounded-lg"
                      >
                        {copiedId === url.id && copiedField === "password" ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-white" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
            resourceType="urls"
            ownerId={selectedOwnerId!}
          />
          <HistoryModal
            open={historyModalOpen}
            onOpenChange={setHistoryModalOpen}
            resourceId={selectedResourceId}
            resourceType="urls"
          />
        </>
      )}
    </div>
  )
}
