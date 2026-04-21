"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Trash2, Edit, Copy, Check, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
    if (confirm("Are you sure you want to delete this URL?")) {
      const { error } = await supabase.from("urls").delete().eq("id", id)
      if (!error) {
        onUpdate()
        router.refresh()
      }
    }
  }

  const handleCopy = (id: string, text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setCopiedField(field)
    setTimeout(() => {
      setCopiedId(null)
      setCopiedField("")
    }, 2000)
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
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-white flex items-center gap-2">
                  {url.title}
                  {url.is_favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleToggleFavorite(url.id, url.is_favorite)}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-yellow-500 hover:text-yellow-500 hover:border hover:border-yellow-500"
                >
                  <Star className={url.is_favorite ? "fill-yellow-400 text-yellow-400" : ""} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => togglePasswordVisibility(url.id)}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-violet-700 hover:text-violet-700 hover:border hover:border-violet-700"
                >
                  {visiblePasswords.has(url.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(url)}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-blue-500 hover:text-blue-500 hover:border hover:border-blue-500"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(url.id)}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-red-500 hover:text-red-500 hover:border hover:border-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <span className="text-slate-300 text-xs uppercase tracking-wide">URL</span>
              <a
                href={url.url.startsWith("http") ? url.url : `https://${url.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 bg-white/5 rounded border border-white/10 text-blue-400 text-sm break-all hover:bg-white/10 hover:text-blue-300 transition-colors"
              >
                {url.url}
              </a>
            </div>

            {url.username && (
              <div className="space-y-2">
                <span className="text-slate-300 text-xs uppercase tracking-wide">Username</span>
                <div className="relative group">
                  <div className="block p-2 pr-12 bg-white/5 rounded border border-white/10 text-slate-200 text-sm break-all">
                    {visiblePasswords.has(url.id) ? url.username : "••••••••"}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(url.id, url.username || "", "username")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 hover:border hover:border-blue-500 text-blue-500 hover:text-blue-500 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {copiedId === url.id && copiedField === "username" ? (
                      <Check className="h-4 w-4 text-green-400 border border-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {url.password && (
              <div className="space-y-2">
                <span className="text-slate-300 text-xs uppercase tracking-wide">Password</span>
                <div className="relative group">
                  <div className="block p-2 pr-12 bg-white/5 rounded border border-white/10 text-slate-200 text-sm break-all font-mono">
                    {visiblePasswords.has(url.id) ? url.password : "••••••••"}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(url.id, url.password || "", "password")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 hover:border hover:border-blue-500 text-blue-500 hover:text-blue-500 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {copiedId === url.id && copiedField === "password" ? (
                      <Check className="h-4 w-4 text-green-400 border border-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
