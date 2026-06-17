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
    }

    setIsLoading(true)

    try {
      console.log("Saving todo with data:", { title, description, remark, status, isFavorite, todoId: todo?.id })
      
      if (todo?.id) {
        // Update existing todo
        const { data: updateData, error } = await supabase
          .from("todos")
          .update({
            title,
            description: description || null,
            remark: remark || null,
            status,
            is_favorite: isFavorite,
            updated_at: new Date().toISOString(),
          })
          .eq("id", todo.id)
          .select()

        if (error) {
          console.error("Supabase update error:", error)
          alert("Error updating todo: " + error.message)
          throw error
        }

        console.log("Update success:", updateData)

        if (!error) {
          if (todo.title !== title) {
            await logHistory({ resourceId: todo.id, resourceType: "todos", action: "updated", fieldName: "Title", newValue: title })
          }
          if (todo.description !== description) {
            await logHistory({ resourceId: todo.id, resourceType: "todos", action: "updated", fieldName: "Description", newValue: description })
          }
          if (todo.status !== status) {
            await logHistory({ resourceId: todo.id, resourceType: "todos", action: "updated", fieldName: "Status", newValue: status })
          }
          if (todo.remark !== remark) {
            await logHistory({ resourceId: todo.id, resourceType: "todos", action: "updated", fieldName: "Remark", newValue: remark })
          }
        }
      } else {
        // Create new todo
        const { data, error } = await supabase.from("todos").insert({
          user_id: userId,
          title,
          description: description || null,
          remark: remark || null,
          status,
          is_favorite: isFavorite,
        }).select().single()

        if (!error && data) {
          await logHistory({ resourceId: data.id, resourceType: "todos", action: "created", newValue: title })
          
          if (shareAfterSave && onSave) {
            onSave(data.id, "todos")
          }
        }
      }

      setTitle("")
      setDescription("")
      setRemark("")
      setStatus("pending")
      setIsFavorite(false)
      setShareAfterSave(false)

      onUpdate?.()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving todo:", error)
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
              <DialogTitle>{todo ? "Edit Todo" : "Add Todo"}</DialogTitle>
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
                  className="bg-slate-900/50 border-slate-700 text-white resize-none overflow-y-auto h-32 !field-sizing-fixed"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: "pending" | "in-process" | "complete") => setStatus(value)}>
                  <SelectTrigger className="bg-slate-950/20 border-slate-700 text-white hover:cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
                    <SelectItem value="pending" className="text-white hover:cursor-pointer">Pending</SelectItem>
                    <SelectItem value="in-process" className="text-blue-500 hover:cursor-pointer">In Progress</SelectItem>
                    <SelectItem value="complete" className="text-green-500 hover:cursor-pointer">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="remark" className={cn(
                  "text-slate-300",
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
                    "bg-slate-900/50 border-slate-700 text-white",
                    (status === "in-process" || status === "complete") && !remark.trim() && "border-red-500/50 focus:border-red-500"
                  )}
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

              {!todo && (
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
                  {isLoading ? "Saving..." : todo ? "Update" : "Add"}
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
