"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus } from "lucide-react"
import { FormulaList } from "@/components/formula-list"
import { FormulaForm } from "@/components/formula-form"
import { createClient } from "@/lib/supabase/client"

interface Formula {
  id: string
  title: string
  description: string | null
  formula: string
  is_favorite: boolean
}

export function FormulasClient({
  initialFormulas,
  userId,
  user,
}: {
  initialFormulas: Formula[]
  userId: string
  user: any
}) {
  const [formulas, setFormulas] = useState<Formula[]>(initialFormulas)
  const [filteredFormulas, setFilteredFormulas] = useState<Formula[]>(initialFormulas)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null)

  const supabase = createClient()

  const loadFormulas = async () => {
    const { data } = await supabase
      .from("formulas")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (data) {
      setFormulas(data)
    }
  }

  useEffect(() => {
    let result = formulas

    // Apply search filter
    if (searchQuery) {
      result = result.filter((f) => f.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Apply favorite filter
    if (filter === "favorites") {
      result = result.filter((f) => f.is_favorite)
    }

    setFilteredFormulas(result)
  }, [searchQuery, filter, formulas])

  const handleAdd = () => {
    setEditingFormula(null)
    setIsFormOpen(true)
  }

  const handleEdit = (formula: Formula) => {
    setEditingFormula(formula)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingFormula(null)
    loadFormulas()
  }

  const handleUpdate = () => {
    loadFormulas()
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">Formulas</h1>
          <p className="text-cyan-500">Manage your Excel formulas</p>
        </div>
        <Button
          onClick={handleAdd}
          className="w-full md:w-auto bg-slate-950/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-blue-600/50"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Formula
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search formulas by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            className="pl-10 bg-slate-900/50 border-slate-700 text-white"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-900/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">
              All Formulas
            </SelectItem>
            <SelectItem value="favorites" className="text-white">
              Favorites
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FormulaList formulas={filteredFormulas} onEdit={handleEdit} onUpdate={handleUpdate} />

      <FormulaForm open={isFormOpen} onOpenChange={handleFormClose} formula={editingFormula} userId={userId} />
    </div>
  )
}
