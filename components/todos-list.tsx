"use client"

import { useState } from "react"
import { Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TodoItem } from "@/components/todo-item"
import { TodoForm } from "@/components/todo-form"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { getBatchSharedWith } from "@/lib/sharing-actions"

const supabase = createClient()
const EMPTY_SHARES_MAP: Record<string, any[]> = {}
const EMPTY_ARRAY: any[] = []

interface Todo {
  id: string
  title: string
  description: string | null
  remark?: string | null
  status: "pending" | "in-process" | "complete"
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export function TodosList({ initialTodos, userId }: { initialTodos: Todo[]; userId: string }) {
  const { data: todos, mutate } = useSWR(
    `todos-${userId}`,
    async () => {
      try {
        // Fetch owned todos
        const { data: ownedData } = await supabase
          .from("todos")
          .select("*")
          .eq("user_id", userId)
          .eq("is_deleted", false)

        // Fetch shared todos
        const { data: sharedData, error: sharedError } = await supabase
          .from("shared_items")
          .select(`
            permission,
            todos (*)
          `)
          .eq("shared_with_id", userId)
          .eq("resource_type", "todos")
        
        if (sharedError && sharedError.code !== "PGRST205") throw sharedError

        const sharedTodos = (sharedData || [])
          .filter(item => item.todos && !item.todos.is_deleted)
          .map(item => ({
            ...item.todos,
            shared_permission: item.permission
          }))

        const allTodos = [...(ownedData || []), ...sharedTodos]
        const sortedTodos = allTodos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as Todo[]

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
        if (error.code !== "PGRST205") {
          console.error("Error loading todos:", error)
        }
        return { todos: [], sharesInfo: EMPTY_SHARES_MAP }
      }
    },
    { fallbackData: { todos: initialTodos, sharesInfo: EMPTY_SHARES_MAP } },
  )

  const { todos = EMPTY_ARRAY, sharesInfo = EMPTY_SHARES_MAP } = data || {}

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
    mutate() // Refresh data after closing form
  }

  const filteredTodos = (Array.isArray(todos) ? todos : []).filter((todo: Todo) => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFavorite = favoriteFilter === "all" || (favoriteFilter === "favorite" && todo.is_favorite)
    const matchesStatus = statusFilter === "all" || todo.status === statusFilter
    const matchesShared = sharedFilter === "all" || (sharedFilter === "shared" && sharesInfo[todo.id] && sharesInfo[todo.id].length > 0)
    return matchesSearch && matchesFavorite && matchesStatus && matchesShared
  })

  return (
    <div className="min-h-screen">
      <div className="p-0 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Todos</h1>
            <p className="text-slate-400">Manage your tasks and track progress</p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-all hover:shadow-lg hover:shadow-blue-600 border border-blue-500 text-blue-500 hover:text-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Todo
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              placeholder="Search todos by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
              <SelectTrigger className="flex-1 md:w-48 bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Filter by favorite" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all">All Todos</SelectItem>
                <SelectItem value="favorite">Favorites</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 md:w-48 bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-process">In Progress</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sharedFilter} onValueChange={setSharedFilter}>
              <SelectTrigger className="flex-1 md:w-48 bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Filter by shared" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {searchQuery || favoriteFilter !== "all" || statusFilter !== "all"
                ? "No todos found matching your filters"
                : "No todos yet. Create your first todo to get started!"}
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <TodoItem 
                key={todo.id} 
                todo={todo} 
                onEdit={handleEdit} 
                onUpdate={() => mutate()} 
                 currentUserId={userId} 
                 initialShares={sharesInfo[todo.id] || EMPTY_ARRAY}
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
    </div>
  )
}
