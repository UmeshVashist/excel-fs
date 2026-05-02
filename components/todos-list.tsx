"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TodoItem } from "@/components/todo-item"
import { TodoForm } from "@/components/todo-form"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface Todo {
  id: string
  title: string
  description: string | null
  remark?: string | null
  status: "pending" | "in-progress" | "complete"
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export function TodosList({ initialTodos, userId }: { initialTodos: Todo[]; userId: string }) {
  const { data: todos, mutate } = useSWR(
    `todos-${userId}`,
    async () => {
      const { data } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      return data as Todo[]
    },
    { fallbackData: initialTodos },
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [favoriteFilter, setFavoriteFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
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

  const filteredTodos = (todos || []).filter((todo) => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFavorite = favoriteFilter === "all" || (favoriteFilter === "favorite" && todo.is_favorite)
    const matchesStatus = statusFilter === "all" || todo.status === statusFilter
    return matchesSearch && matchesFavorite && matchesStatus
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
              className="pl-10 bg-slate-800/50 border-slate-700 text-white"
            />
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
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {searchQuery || favoriteFilter !== "all" || statusFilter !== "all"
                ? "No todos found matching your filters"
                : "No todos yet. Create your first todo to get started!"}
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onEdit={handleEdit} onUpdate={() => mutate()} />
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
