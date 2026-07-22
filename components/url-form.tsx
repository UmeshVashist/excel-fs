"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LoadingIcon } from "@/components/loading-icon"
import { logHistory } from "@/lib/sharing-actions"

interface Url {
  id?: string
  title: string
  url: string
  username: string | null
  password: string | null
  is_favorite: boolean
}

export function UrlForm({
  open,
  onOpenChange,
  url,
  userId,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  url?: Url | null
  userId: string
  onSave?: (resourceId: string, resourceType: string) => void
}) {
  const [title, setTitle] = useState("")
  const [urlText, setUrlText] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [shareAfterSave, setShareAfterSave] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (url) {
      setTitle(url.title)
      setUrlText(url.url)
      setUsername(url.username || "")
      setPassword(url.password || "")
      setIsFavorite(url.is_favorite)
    } else {
      setTitle("")
      setUrlText("")
      setUsername("")
      setPassword("")
      setIsFavorite(false)
    }
  }, [url])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (url?.id) {
        // Update existing URL
        const { error } = await supabase
          .from("urls")
          .update({
            title,
            url: urlText,
            username: username || null,
            password: password || null,
            is_favorite: isFavorite,
            updated_at: new Date().toISOString(),
          })
          .eq("id", url.id)

        if (!error) {
          if (url.title !== title) {
            await logHistory({ resourceId: url.id, resourceType: "urls", action: "updated", fieldName: "Title", newValue: title, userId })
          }
          if (url.url !== urlText) {
            await logHistory({ resourceId: url.id, resourceType: "urls", action: "updated", fieldName: "URL", newValue: urlText, userId })
          }
          if (url.username !== username) {
            await logHistory({ resourceId: url.id, resourceType: "urls", action: "updated", fieldName: "Username", newValue: username, userId })
          }
        }
      } else {
        // Create new URL
        const insertPayload: any = {
          user_id: userId,
          title,
          url: urlText,
          username: username || null,
          password: password || null,
          is_favorite: isFavorite,
        }

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
        if (!isUUID) {
          delete insertPayload.user_id
          insertPayload.clerk_user_id = userId
        } else {
          insertPayload.clerk_user_id = (url as any)?.clerk_user_id || undefined
        }

        const { data, error } = await supabase.from("urls").insert(insertPayload).select().single()

        if (!error && data) {
          await logHistory({ resourceId: data.id, resourceType: "urls", action: "created", newValue: title, userId })
          
          if (shareAfterSave && onSave) {
            onSave(data.id, "urls")
          }
        } else if (error) {
          console.error("[v0] Insert url error:", error)
        }
      }

      setTitle("")
      setUrlText("")
      setUsername("")
      setPassword("")
      setIsFavorite(false)
      setShareAfterSave(false)

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving URL:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 border-slate-800 backdrop-blur-2xl text-white shadow-2xl rounded-2xl sm:max-w-md">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <LoadingIcon />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold">{url ? "Edit URL" : "Add URL"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-200 text-xs font-semibold">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoComplete="off"
                  className="bg-slate-950/60 border-slate-700/80 text-white h-10 text-sm rounded-xl focus:border-cyan-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url" className="text-slate-200 text-xs font-semibold">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={urlText}
                  onChange={(e) => setUrlText(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="https://example.com"
                  className="bg-slate-950/60 border-slate-700/80 text-white h-10 text-sm rounded-xl focus:border-cyan-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-200 text-xs font-semibold">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  className="bg-slate-950/60 border-slate-700/80 text-white h-10 text-sm rounded-xl focus:border-cyan-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200 text-xs font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  className="bg-slate-950/60 border-slate-700/80 text-white h-10 text-sm rounded-xl focus:border-cyan-500 transition-all"
                />
              </div>
              <div className="flex items-center space-x-2.5 pt-1">
                <Checkbox
                  id="favorite"
                  checked={isFavorite}
                  onCheckedChange={(checked) => setIsFavorite(checked as boolean)}
                />
                <Label htmlFor="favorite" className="cursor-pointer text-sm font-medium text-slate-200">
                  Mark as favorite
                </Label>
              </div>

              {!url && (
                <div className="flex items-center space-x-2.5">
                  <Checkbox
                    id="shareAfterSave"
                    checked={shareAfterSave}
                    onCheckedChange={(checked) => setShareAfterSave(checked as boolean)}
                  />
                  <Label htmlFor="shareAfterSave" className="cursor-pointer text-sm text-indigo-400 font-semibold">
                    Share after saving
                  </Label>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-custom btn-custom-cyan h-10"
                >
                  {isLoading ? "Saving..." : url ? "Update" : "Add"}
                </Button>
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 btn-custom btn-custom-red h-10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
