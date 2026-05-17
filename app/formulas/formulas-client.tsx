"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, X } from "lucide-react"
import { FormulaList } from "@/components/formula-list"
import { FormulaForm } from "@/components/formula-form"
import { createClient } from "@/lib/supabase/client"
import { getBatchSharedWith } from "@/lib/sharing-actions"

interface Formula {
  id: string
  title: string
  description: string | null
  formula: string
  is_favorite: boolean
  user_id: string
  shared_permission?: "view" | "edit"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [favoriteFilter, setFavoriteFilter] = useState("all")
  const [sharedFilter, setSharedFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null)
  const [sharesInfo, setSharesInfo] = useState<Record<string, any[]>>({})

  const supabase = useMemo(() => createClient(), [])

  // Sync state with props when server data refreshes
  useEffect(() => {
    setFormulas(initialFormulas)
  }, [initialFormulas])

  useEffect(() => {
    loadShares()
  }, [formulas])

  const loadShares = async () => {
    const ownerFormulaIds = formulas
      .filter(f => f.user_id === userId)
      .map(f => f.id)
    
    if (ownerFormulaIds.length > 0) {
      const info = await getBatchSharedWith(ownerFormulaIds, "formulas")
      setSharesInfo(info)
    } else {
      setSharesInfo({})
    }
  }

  const loadFormulas = async () => {
    try {
      // Fetch only owned formulas
      const { data: ownedData } = await supabase
        .from("formulas")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })

      setFormulas(ownedData || [])
    } catch (error: any) {
      if (error.code !== "PGRST205") {
        console.error("Error loading formulas:", error)
      }
    }
  }

  const filteredFormulas = useMemo(() => {
    let result = formulas.filter(f => f.user_id === userId) // Only self-created items

    // Apply search filter
    if (searchQuery) {
      result = result.filter((f) => 
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply favorite filter
    if (favoriteFilter === "favorites") {
      result = result.filter((f) => f.is_favorite)
    } else if (favoriteFilter === "unfavorites") {
      result = result.filter((f) => !f.is_favorite)
    }

    // Apply shared filter
    if (sharedFilter === "shared") {
      // Show ONLY items I've shared with others
      result = result.filter((f) => sharesInfo[f.id] && sharesInfo[f.id].length > 0)
    } else if (sharedFilter === "unshare") {
      // Show only items I own AND haven't shared with anyone
      result = result.filter((f) => !sharesInfo[f.id] || sharesInfo[f.id].length === 0)
    }

    return result
  }, [searchQuery, favoriteFilter, sharedFilter, formulas, sharesInfo, userId])

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

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    const { error } = await supabase.from("formulas").update({ is_favorite: !currentFavorite }).eq("id", id)
    if (!error) {
      loadFormulas()
    }
  }

  const handleDelete = async (id: string, ownerId: string) => {
    const isOwner = ownerId === userId

    if (isOwner) {
      if (confirm("Are you sure you want to move this formula to Recycle Bin?")) {
        const { error } = await supabase
          .from("formulas")
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString() 
          })
          .eq("id", id)
        
        if (!error) {
          loadFormulas()
        }
      }
    } else {
      if (confirm("This item was shared with you. Are you sure you want to remove it from your list?")) {
        const { error } = await supabase
          .from("shared_items")
          .delete()
          .eq("resource_id", id)
          .eq("shared_with_id", userId)
          .eq("resource_type", "formulas")
        
        if (!error) {
          loadFormulas()
        }
      }
    }
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
          className="btn-custom btn-custom-cyan w-full sm:w-auto px-5 h-9 text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
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
            className="pl-10 pr-10 bg-slate-900/50 border-slate-700 text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/20 text-white hover:cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
            <SelectItem value="all" className="text-white hover:text-white cursor-pointer transition-colors">
              All
            </SelectItem>
            <SelectItem value="favorites" className="text-orange-500 hover:text-white cursor-pointer transition-colors">
              Favorites
            </SelectItem>
            <SelectItem value="unfavorites" className="text-green-500 hover:text-white cursor-pointer transition-colors">
              Unfavorites
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={sharedFilter} onValueChange={setSharedFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/20 text-white hover:cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
            <SelectItem value="all" className="text-white hover:text-white cursor-pointer transition-colors">
              All Items
            </SelectItem>
            <SelectItem value="shared" className="text-indigo-500 hover:text-white cursor-pointer transition-colors">
              Shared
            </SelectItem>
            <SelectItem value="unshare" className="text-red-500 hover:text-white cursor-pointer transition-colors">
              Unshare
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FormulaList 
        formulas={filteredFormulas} 
        onEdit={handleEdit} 
        onUpdate={loadFormulas} 
        currentUserId={userId} 
        sharesInfo={sharesInfo}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
      />

      <FormulaForm open={isFormOpen} onOpenChange={handleFormClose} formula={editingFormula} userId={userId} />
    </div>
  )
}
