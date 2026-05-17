"use client"

import { useState, useMemo } from "react"
import { Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TodoItem } from "@/components/todo-item"
import { TodoForm } from "@/components/todo-form"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { SidebarProvider } from "@/components/sidebar-provider"
import { getBatchSharedWith } from "@/lib/sharing-actions"

const EMPTY_ARRAY: any[] = []

interface Todo {
  id: string
  title: string
  description: string | null
  status: "pending" | "in-process" | "complete"
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export function TodosClient({
  initialTodos,
  userId,
  user,
}: {
  initialTodos: Todo[]
  userId: string
  user?: any
}) {
  const supabase = useMemo(() => createClient(), [])
  const { data, mutate } = useSWR(
    `todos-${userId}`,
    async () => {
      try {
        // Fetch only owned todos
        const { data: ownedData, error: ownedError } = await supabase
          .from("todos")
          .select("*")
          .eq("user_id", userId)
          .eq("is_deleted", false)
        
        if (ownedError) {
          console.error("Error fetching owned todos:", ownedError)
          throw ownedError
        }

        const sortedTodos = (ownedData || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as Todo[]

        // Fetch shares info for owned todos
        const ownedIds = (ownedData || []).map(t => t.id)
        let sharesInfo = {}
        if (ownedIds.length > 0) {
          sharesInfo = await getBatchSharedWith(ownedIds, "todos")
        }

        return {
          todos: sortedTodos,
          sharesInfo
        }
      } catch (error: any) {
        console.error("Detailed load error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error
        })
        return { todos: [], sharesInfo: {} }
      }
    },
    { fallbackData: { todos: initialTodos, sharesInfo: {} } },
  )

  const { todos = EMPTY_ARRAY, sharesInfo = {} as any } = data || {}

  const [searchQuery, setSearchQuery] = useState("")
  const [favoriteFilter, setFavoriteFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sharedFilter, setSharedFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingTodo(null)
    mutate()
  }

  const filteredTodos = (todos as Todo[]).filter((todo) => {
    // Only show self-created items on this page
    if ((todo as any).user_id !== userId) return false

    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFavorite =
      favoriteFilter === "all" ||
      (favoriteFilter === "favorite" && todo.is_favorite) ||
      (favoriteFilter === "unfavorite" && !todo.is_favorite)
    const matchesStatus = statusFilter === "all" || todo.status === statusFilter
    const matchesShared = 
      sharedFilter === "all" || 
      (sharedFilter === "shared" && sharesInfo[todo.id] && sharesInfo[todo.id].length > 0) ||
      (sharedFilter === "unshare" && !sharesInfo[todo.id] || sharesInfo[todo.id].length === 0)
    return matchesSearch && matchesFavorite && matchesStatus && matchesShared
  })

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">Todos</h1>
          <p className="text-cyan-500">Manage your tasks and track progress</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="btn-custom btn-custom-cyan w-full sm:w-auto px-5 h-9 text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Todo
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search todos by title..."
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
            <SelectItem value="favorite" className="text-orange-500 hover:text-white cursor-pointer transition-colors">
              Favorites
            </SelectItem>
            <SelectItem value="unfavorite" className="text-green-500 hover:text-white cursor-pointer transition-colors">
              Unfavorites
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-slate-950/20 text-white hover:cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
            <SelectItem value="all" className="text-white hover:text-white cursor-pointer transition-colors">
              All Status
            </SelectItem>
            <SelectItem value="pending" className="text-yellow-500 hover:text-white cursor-pointer transition-colors">
              Pending
            </SelectItem>
            <SelectItem value="in-process" className="text-blue-500 hover:text-white cursor-pointer transition-colors">
              In Progress
            </SelectItem>
            <SelectItem value="complete" className="text-green-500 hover:text-white cursor-pointer transition-colors">
              Complete
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

      <div className="space-y-4">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            {searchQuery || favoriteFilter !== "all" || statusFilter !== "all" || sharedFilter !== "all"
              ? "No todos found matching your filters"
              : "No todos found. Add your first todo to get started!"}
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <TodoItem 
              key={todo.id} 
              todo={todo} 
              onEdit={handleEdit} 
              onUpdate={() => mutate()} 
              currentUserId={userId} 
              initialShares={sharesInfo[todo.id] || []}
            />
          ))
        )}
      </div>

      <TodoForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        todo={editingTodo}
        userId={userId}
        onUpdate={() => mutate()}
      />
    </div>
  )
}
