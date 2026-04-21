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
import { SidebarProvider } from "@/components/sidebar-provider"

const supabase = createClient()

interface Todo {
  id: string
  title: string
  description: string | null
  status: "pending" | "in-progress" | "complete"
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
    mutate()
  }

  const filteredTodos = (todos || []).filter((todo) => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFavorite = favoriteFilter === "all" || (favoriteFilter === "favorite" && todo.is_favorite)
    const matchesStatus = statusFilter === "all" || todo.status === statusFilter
    return matchesSearch && matchesFavorite && matchesStatus
  })

  return (
    <SidebarProvider user={user}>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-orange-500 mb-2">Todos</h1>
            <p className="text-cyan-500">Manage your tasks and track progress</p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="w-full md:w-auto bg-slate-950/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-blue-600/50"
          >
            <Plus className="mr-2 h-4 w-4" />
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
              className="pl-10 bg-slate-900/50 border-slate-700 text-white"
            />
          </div>
          <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-900/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">
                All Todos
              </SelectItem>
              <SelectItem value="favorite" className="text-white">
                Favorites
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-900/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">
                All
              </SelectItem>
              <SelectItem value="pending" className="text-white">
                Pending
              </SelectItem>
              <SelectItem value="in-progress" className="text-white">
                In Progress
              </SelectItem>
              <SelectItem value="complete" className="text-white">
                Complete
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {searchQuery || favoriteFilter !== "all" || statusFilter !== "all"
                ? "No todos found matching your filters"
                : "No todos found. Add your first todo to get started!"}
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
    </SidebarProvider>
  )
}
