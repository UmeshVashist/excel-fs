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
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  url?: Url | null
  userId: string
}) {
  const [title, setTitle] = useState("")
  const [urlText, setUrlText] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
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
        await supabase
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
      } else {
        // Create new URL
        await supabase.from("urls").insert({
          user_id: userId,
          title,
          url: urlText,
          username: username || null,
          password: password || null,
          is_favorite: isFavorite,
        })
      }

      setTitle("")
      setUrlText("")
      setUsername("")
      setPassword("")
      setIsFavorite(false)

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
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingIcon />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{url ? "Edit URL" : "Add URL"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoComplete="off"
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={urlText}
                  onChange={(e) => setUrlText(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="https://example.com"
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="favorite"
                  checked={isFavorite}
                  onCheckedChange={(checked) => setIsFavorite(checked as boolean)}
                  className="border-slate-700 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                />
                <Label htmlFor="favorite" className="cursor-pointer">
                  Mark as favorite
                </Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-slate-950/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-blue-600/50"
                >
                  {isLoading ? "Saving..." : url ? "Update" : "Add"}
                </Button>
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 bg-slate-950/20 text-red-400 border border-red-500/50 hover:bg-red-500/20 hover:border-red-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-red-600/50"
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
