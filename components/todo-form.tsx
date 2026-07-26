"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { addItemAction, updateItemAction } from "@/lib/item-actions"
import { useRouter } from "next/navigation"
import { LoadingIcon } from "@/components/loading-icon"
import { cn } from "@/lib/utils"
import { logHistory } from "@/lib/sharing-actions"

interface Todo {
  id?: string
  title: string
  description: string | null
  remark?: string | null
  status: "pending" | "in-process" | "complete"
  is_favorite: boolean
}

export function TodoForm({
  open,
  onOpenChange,
  todo,
  userId,
  onUpdate,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  todo?: Todo | null
  userId: string
  onUpdate?: () => void
  onSave?: (resourceId: string, resourceType: string) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [remark, setRemark] = useState("")
  const [status, setStatus] = useState<"pending" | "in-process" | "complete">("pending")
  const [isFavorite, setIsFavorite] = useState(false)
  const [shareAfterSave, setShareAfterSave] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description || "")
      setRemark(todo.remark || "")
      setStatus(todo.status)
      setIsFavorite(todo.is_favorite)
    } else {
      setTitle("")
      setDescription("")
      setRemark("")
      setStatus("pending")
      setIsFavorite(false)
    }
  }, [todo, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Remark is required when status is "in-process" or "complete"
    if ((status === "in-process" || status === "complete") && !remark.trim()) {
      alert(`Remark is required when a Todo is ${status === "in-process" ? "In Process" : "Completed"}.`)
      return
    setIsLoading(true)

    try {
      if (todo?.id) {
        const res = await updateItemAction("todos", todo.id, {
          title,
          description: description || null,
          remark: remark || null,
          status,
          is_favorite: isFavorite,
        })
        if (res.error) console.error("Update todo error:", res.error)
      } else {
        const res = await addItemAction("todos", {
          user_id: userId,
          title,
          description: description || null,
          remark: remark || null,
          status,
          is_favorite: isFavorite,
        })
        if (!res.error && res.data && shareAfterSave && onSave) {
          onSave(res.data.id, "todos")
        }
      }

      setShareAfterSave(false)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving todo:", error)
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
              <DialogTitle className="text-white text-xl font-bold">{todo ? "Edit Todo" : "Add Todo"}</DialogTitle>
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
                  className="bg-slate-950/60 border-slate-700/80 text-white text-sm rounded-xl focus:border-cyan-500 transition-all resize-none overflow-y-auto h-28 !field-sizing-fixed"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-200 text-xs font-semibold">Status</Label>
                <Select value={status} onValueChange={(value: "pending" | "in-process" | "complete") => setStatus(value)}>
                  <SelectTrigger className="bg-slate-900/60 backdrop-blur-md border-white/15 text-white h-10 rounded-xl hover:border-cyan-500/50 transition-all cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/85 backdrop-blur-xl border-white/15 shadow-2xl">
                    <SelectItem value="pending" className="text-slate-200 cursor-pointer">Pending</SelectItem>
                    <SelectItem value="in-process" className="text-blue-400 font-semibold cursor-pointer">In Progress</SelectItem>
                    <SelectItem value="complete" className="text-green-400 font-semibold cursor-pointer">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="remark" className={cn(
                  "text-xs font-semibold text-slate-200",
                  (status === "in-process" || status === "complete") && "text-orange-400"
                )}>
                  Remark {(status === "in-process" || status === "complete") && <span className="text-red-500 font-bold">*</span>}
                </Label>
                <Input
                  id="remark"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder={
                    status === "pending" 
                      ? "Enter remark (Optional)" 
                      : `Enter ${status === "in-process" ? "progress" : "completion"} remark (Required)`
                  }
                  autoComplete="off"
                  className={cn(
                    "bg-slate-950/60 border-slate-700/80 text-white h-10 text-sm rounded-xl focus:border-cyan-500 transition-all",
                    (status === "in-process" || status === "complete") && !remark.trim() && "border-red-500/50 focus:border-red-500"
                  )}
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

              {!todo && (
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
                  {isLoading ? "Saving..." : todo ? "Update" : "Add"}
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
