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
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  formula?: Formula | null
  userId: string
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [formulaText, setFormulaText] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
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
            await logHistory({ resourceId: formula.id, resourceType: "formulas", action: "updated", fieldName: "Title", newValue: title })
          }
          if (formula.description !== description) {
            await logHistory({ resourceId: formula.id, resourceType: "formulas", action: "updated", fieldName: "Description", newValue: description })
          }
          if (formula.formula !== formulaText) {
            await logHistory({ resourceId: formula.id, resourceType: "formulas", action: "updated", fieldName: "Formula", newValue: formulaText })
          }
        }
      } else {
        // Create new formula
        const { data, error } = await supabase.from("formulas").insert({
          user_id: userId,
          title,
          description: description || null,
          formula: formulaText,
          is_favorite: isFavorite,
        }).select().single()

        if (!error && data) {
          await logHistory({ resourceId: data.id, resourceType: "formulas", action: "created", newValue: title })
        }
      }

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
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingIcon />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{formula ? "Edit Formula" : "Add Formula"}</DialogTitle>
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
                <Label htmlFor="formula">Formula</Label>
                <Input
                  id="formula"
                  value={formulaText}
                  onChange={(e) => setFormulaText(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="=VLOOKUP(A2, B2:D10, 3, FALSE)"
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
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-custom btn-custom-cyan"
                >
                  {isLoading ? "Saving..." : formula ? "Update" : "Add"}
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
