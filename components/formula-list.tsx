"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Trash2, Edit, Copy, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
    if (confirm("Are you sure you want to delete this formula?")) {
      const { error } = await supabase.from("formulas").delete().eq("id", id)
      if (!error) {
        onUpdate() // call onUpdate to refresh local state
        router.refresh()
      }
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
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
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-white flex items-center gap-2">
                  {formula.title}
                  {formula.is_favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                </CardTitle>
                {formula.description && (
                  <CardDescription className="text-slate-300 mt-1">{formula.description}</CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleToggleFavorite(formula.id, formula.is_favorite)}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-yellow-500 hover:text-yellow-500 hover:border hover:border-yellow-500"
                >
                  <Star className={formula.is_favorite ? "fill-yellow-400 text-yellow-400" : ""} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(formula)}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-blue-500 hover:text-blue-500 hover:border hover:border-blue-500"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(formula.id)}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-red-500 hover:text-red-500 hover:border hover:border-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative group">
              <code className="block p-3 pr-12 bg-white/5 rounded border border-white/10 text-blue-400 font-mono text-sm overflow-x-auto whitespace-pre">
                {formula.formula}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleCopy(formula.id, formula.formula)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 hover:border hover:border-blue-500 text-blue-500 hover:text-blue-500 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all"
              >
                {copiedId === formula.id ? (
                  <Check className="h-4 w-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-green-400 border border-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
