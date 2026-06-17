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
        // Update existing shortcut
        const { error } = await supabase
          .from("shortcuts")
          .update({
            title,
            description: description || null,
            shortcut: shortcutText,
            is_favorite: isFavorite,
            updated_at: new Date().toISOString(),
          })
          .eq("id", shortcut.id)

        if (!error) {
          if (shortcut.title !== title) {
            await logHistory({ resourceId: shortcut.id, resourceType: "shortcuts", action: "updated", fieldName: "Title", newValue: title })
          }
          if (shortcut.description !== description) {
            await logHistory({ resourceId: shortcut.id, resourceType: "shortcuts", action: "updated", fieldName: "Description", newValue: description })
          }
          if (shortcut.shortcut !== shortcutText) {
            await logHistory({ resourceId: shortcut.id, resourceType: "shortcuts", action: "updated", fieldName: "Shortcut", newValue: shortcutText })
          }
        }
      } else {
        // Create new shortcut
        const { data, error } = await supabase.from("shortcuts").insert({
          user_id: userId,
          title,
          description: description || null,
          shortcut: shortcutText,
          is_favorite: isFavorite,
        }).select().single()

        if (!error && data) {
          await logHistory({ resourceId: data.id, resourceType: "shortcuts", action: "created", newValue: title })
          
          if (shareAfterSave && onSave) {
            onSave(data.id, "shortcuts")
          }
        }
      }

      setShareAfterSave(false)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving shortcut:", error)
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
              <DialogTitle>{shortcut ? "Edit Shortcut" : "Add Shortcut"}</DialogTitle>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  autoComplete="off"
                  className="bg-slate-900/50 border-slate-700 text-white"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortcut">Shortcut</Label>
                <Input
                  id="shortcut"
                  value={shortcutText}
                  onChange={(e) => setShortcutText(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="Ctrl + C"
                  className="bg-slate-900/50 border-slate-700 text-white font-mono"
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

              {!shortcut && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shareAfterSave"
                    checked={shareAfterSave}
                    onCheckedChange={(checked) => setShareAfterSave(checked as boolean)}
                    className="border-slate-700 data-[state=checked]:bg-indigo-500 data-[state=checked]:text-white bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                  />
                  <Label htmlFor="shareAfterSave" className="cursor-pointer text-indigo-400 font-medium">
                    Share after saving
                  </Label>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-custom btn-custom-cyan"
                >
                  {isLoading ? "Saving..." : shortcut ? "Update" : "Add"}
                </Button>
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 btn-custom btn-custom-red"
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
