"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Trash2, Edit, Copy, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { copyToClipboard } from "@/lib/utils"

interface Formula {
  id: string
  title: string
  description: string | null
  formula: string
  is_favorite: boolean
}

export function FormulaList({
  formulas,
  onEdit,
  onUpdate, // added onUpdate prop
}: {
  formulas: Formula[]
  onEdit: (formula: Formula) => void
  onUpdate: () => void // added onUpdate prop type
}) {
  const router = useRouter()
  const supabase = createClient()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    const { error } = await supabase.from("formulas").update({ is_favorite: !currentFavorite }).eq("id", id)
    if (!error) {
      onUpdate() // call onUpdate to refresh local state
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to move this formula to Recycle Bin?")) {
      const { error } = await supabase
        .from("formulas")
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq("id", id)
      
      if (!error) {
        onUpdate() // call onUpdate to refresh local state
        router.refresh()
      }
    }
  }

  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  if (formulas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No formulas found. Add your first formula to get started!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {formulas.map((formula) => (
        <Card key={formula.id} className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-white flex items-center gap-2 flex-wrap text-lg">
                  {formula.title}
                  {formula.is_favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />}
                </CardTitle>
                {formula.description && (
                  <CardDescription className="text-slate-300 mt-1 line-clamp-1">{formula.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleToggleFavorite(formula.id, formula.is_favorite)}
                  className="btn-custom btn-custom-amber h-9 w-9 px-0 rounded-lg"
                >
                  <Star className={formula.is_favorite ? "fill-white text-white h-4 w-4" : "h-4 w-4 text-white"} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(formula)}
                  className="btn-custom btn-custom-purple h-9 w-9 px-0 rounded-lg"
                >
                  <Edit className="h-4 w-4 text-white" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(formula.id)}
                  className="btn-custom btn-custom-red h-9 w-9 px-0 rounded-lg"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative group">
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-white/5 rounded border border-white/10 text-blue-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap break-all min-h-[3rem]">
                  {formula.formula}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleCopy(formula.id, formula.formula)}
                  className="btn-custom btn-custom-cyan h-9 w-9 px-0 shrink-0 rounded-lg"
                >
                  {copiedId === formula.id ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-white" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
