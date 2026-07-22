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

interface Formula {
  id?: string
  title: string
  description: string | null
  formula: string
  is_favorite: boolean
}

export function FormulaForm({
  open,
  onOpenChange,
  formula,
  userId,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  formula?: Formula | null
  userId: string
  onSave?: (resourceId: string, resourceType: string) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [formulaText, setFormulaText] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [shareAfterSave, setShareAfterSave] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (formula) {
      setTitle(formula.title)
      setDescription(formula.description || "")
      setFormulaText(formula.formula)
      setIsFavorite(formula.is_favorite)
    } else {
      setTitle("")
      setDescription("")
      setFormulaText("")
      setIsFavorite(false)
    }
  }, [formula, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (formula?.id) {
        // Update existing formula
        const { error } = await supabase
          .from("formulas")
          .update({
            title,
            description: description || null,
            formula: formulaText,
            is_favorite: isFavorite,
            updated_at: new Date().toISOString(),
          })
          .eq("id", formula.id)

        if (!error) {
          // Log changes
          if (formula.title !== title) {
            await logHistory({ resourceId: formula.id, resourceType: "formulas", action: "updated", fieldName: "Title", newValue: title, userId })
          }
          if (formula.description !== description) {
            await logHistory({ resourceId: formula.id, resourceType: "formulas", action: "updated", fieldName: "Description", newValue: description, userId })
          }
          if (formula.formula !== formulaText) {
            await logHistory({ resourceId: formula.id, resourceType: "formulas", action: "updated", fieldName: "Formula", newValue: formulaText, userId })
          }
        }
      } else {
        // Create new formula
        const insertPayload: any = {
          user_id: userId,
          title,
          description: description || null,
          formula: formulaText,
          is_favorite: isFavorite,
        }

        // If userId is a valid UUID, include it as user_id. Always include clerk_user_id if present.
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
        if (!isUUID) {
          delete insertPayload.user_id
          insertPayload.clerk_user_id = userId
        } else {
          insertPayload.clerk_user_id = (formula as any)?.clerk_user_id || undefined
        }

        const { data, error } = await supabase.from("formulas").insert(insertPayload).select().single()

        if (!error && data) {
          await logHistory({ resourceId: data.id, resourceType: "formulas", action: "created", newValue: title, userId })
          
          if (shareAfterSave && onSave) {
            onSave(data.id, "formulas")
          }
        } else if (error) {
          console.error("[v0] Insert formula error:", error)
        }
      }

      setShareAfterSave(false)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving formula:", error)
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
              <DialogTitle className="text-white text-xl font-bold">{formula ? "Edit Formula" : "Add Formula"}</DialogTitle>
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
                <Label htmlFor="formula" className="text-slate-200 text-xs font-semibold">Formula</Label>
                <Input
                  id="formula"
                  value={formulaText}
                  onChange={(e) => setFormulaText(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="=VLOOKUP(A2, B2:D10, 3, FALSE)"
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

              {!formula && (
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
                  {isLoading ? "Saving..." : formula ? "Update" : "Add"}
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
