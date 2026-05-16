"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Trash2, Edit, Copy, Check, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { copyToClipboard } from "@/lib/utils"

interface Url {
  id: string
  title: string
  url: string
  username: string | null
  password: string | null
  is_favorite: boolean
}

export function UrlsList({
  urls,
  onEdit,
  onUpdate,
}: {
  urls: Url[]
  onEdit: (url: Url) => void
  onUpdate: () => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string>("")
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    const { error } = await supabase.from("urls").update({ is_favorite: !currentFavorite }).eq("id", id)
    if (!error) {
      onUpdate()
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
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
        router.refresh()
      }
    }
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
      {urls.map((url) => (
        <Card key={url.id} className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-white flex items-center gap-2 flex-wrap text-lg">
                  {url.title}
                  {url.is_favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />}
                </CardTitle>
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
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => togglePasswordVisibility(url.id)}
                  className="btn-custom btn-custom-purple h-9 w-9 px-0 rounded-lg"
                >
                  {visiblePasswords.has(url.id) ? <EyeOff className="h-4 w-4 text-white" /> : <Eye className="h-4 w-4 text-white" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(url)}
                  className="btn-custom btn-custom-purple h-9 w-9 px-0 rounded-lg"
                >
                  <Edit className="h-4 w-4 text-white" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(url.id)}
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
      ))}
    </div>
  )
}
