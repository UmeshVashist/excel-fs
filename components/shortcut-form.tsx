"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { addItemAction, updateItemAction } from "@/lib/item-actions"
import { useRouter } from "next/navigation"
import { LoadingIcon } from "@/components/loading-icon"
import { logHistory } from "@/lib/sharing-actions"

interface Shortcut {
  id?: string
  title: string
  description: string | null
  shortcut: string
  is_favorite: boolean
}

export function ShortcutForm({
  open,
  onOpenChange,
  shortcut,
  userId,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortcut?: Shortcut | null
  userId: string
  onSave?: (resourceId: string, resourceType: string) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [shortcutText, setShortcutText] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [shareAfterSave, setShareAfterSave] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (shortcut) {
      setTitle(shortcut.title)
      setDescription(shortcut.description || "")
      setShortcutText(shortcut.shortcut)
      setIsFavorite(shortcut.is_favorite)
    } else {
      setTitle("")
      setDescription("")
      setShortcutText("")
      setIsFavorite(false)
    }
  }, [shortcut, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (shortcut?.id) {
        const res = await updateItemAction("shortcuts", shortcut.id, {
          title,
          description: description || null,
          shortcut: shortcutText,
          is_favorite: isFavorite,
        })
        if (res.error) console.error("Update shortcut error:", res.error)
      } else {
        const res = await addItemAction("shortcuts", {
          user_id: userId,
          title,
          description: description || null,
          shortcut: shortcutText,
          is_favorite: isFavorite,
        })
        if (!res.error && res.data && shareAfterSave && onSave) {
          onSave(res.data.id, "shortcuts")
        }
      }

      setShareAfterSave(false)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving shortcut:", error)
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
              <DialogTitle className="text-white text-xl font-bold">{shortcut ? "Edit Shortcut" : "Add Shortcut"}</DialogTitle>
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
                <Label htmlFor="description" className="text-slate-200 text-xs font-semibold">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  autoComplete="off"
                  className="bg-slate-950/60 border-slate-700/80 text-white text-sm rounded-xl focus:border-cyan-500 transition-all"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortcut" className="text-slate-200 text-xs font-semibold">Shortcut</Label>
                <Input
                  id="shortcut"
                  value={shortcutText}
                  onChange={(e) => setShortcutText(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="Ctrl + C"
                  className="bg-slate-950/60 border-slate-700/80 text-white font-mono text-sm h-10 rounded-xl focus:border-cyan-500 transition-all"
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

              {!shortcut && (
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
                  {isLoading ? "Saving..." : shortcut ? "Update" : "Add"}
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
