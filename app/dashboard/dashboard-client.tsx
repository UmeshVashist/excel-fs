"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { FormulaList } from "@/components/formula-list"
import { ShortcutList } from "@/components/shortcut-list"
import { NotesList } from "@/components/notes-list"
import { UrlsList } from "@/components/urls-list"
import { SearchingLoader } from "@/components/searching-loader"

export function DashboardClient({
  initialFormulasCount,
  initialShortcutsCount,
  initialNotesCount,
  initialUrlsCount,
  initialTodosCount,
  userId,
}: {
  initialFormulasCount: number
  initialShortcutsCount: number
  initialNotesCount: number
  initialUrlsCount: number
  initialTodosCount: number
  userId: string
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchCategory, setSearchCategory] = useState("all")
  const [searchResults, setSearchResults] = useState<any>({
    formulas: [],
    shortcuts: [],
    notes: [],
    urls: [],
    todos: [],
  })
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ formulas: [], shortcuts: [], notes: [], urls: [], todos: [] })
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      const results: any = { formulas: [], shortcuts: [], notes: [], urls: [], todos: [] }

      // Search based on category selection
      if (searchCategory === "all" || searchCategory === "formulas") {
        const { data } = await supabase
          .from("formulas")
          .select("*")
          .eq("user_id", userId)
          .ilike("title", `%${searchQuery}%`)
          .limit(5)
        results.formulas = data || []
      }

      if (searchCategory === "all" || searchCategory === "shortcuts") {
        const { data } = await supabase
          .from("shortcuts")
          .select("*")
          .eq("user_id", userId)
          .ilike("title", `%${searchQuery}%`)
          .limit(5)
        results.shortcuts = data || []
      }

      if (searchCategory === "all" || searchCategory === "notes") {
        const { data } = await supabase
          .from("notes")
          .select("*")
          .eq("user_id", userId)
          .ilike("title", `%${searchQuery}%`)
          .limit(5)
        results.notes = data || []
      }

      if (searchCategory === "all" || searchCategory === "urls") {
        const { data } = await supabase
          .from("urls")
          .select("*")
          .eq("user_id", userId)
          .ilike("title", `%${searchQuery}%`)
          .limit(5)
        results.urls = data || []
      }

      if (searchCategory === "all" || searchCategory === "todos") {
        const { data } = await supabase
          .from("todos")
          .select("*")
          .eq("user_id", userId)
          .ilike("title", `%${searchQuery}%`)
          .limit(5)
        results.todos = data || []
      }

      setSearchResults(results)
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchCategory, userId, supabase])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div onClick={() => router.push("/formulas")} className="cursor-pointer">
          <Card className="border text-center border-cyan-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-cyan-500 text-lg">Formulas</CardTitle>
              <CardDescription className="text-cyan-500 text-2xl font-bold">{initialFormulasCount}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div onClick={() => router.push("/shortcuts")} className="cursor-pointer">
          <Card className="border text-center border-orange-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-orange-500/50 hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-500 text-lg">Shortcuts</CardTitle>
              <CardDescription className="text-orange-500 text-2xl font-bold">{initialShortcutsCount}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div onClick={() => router.push("/notes")} className="cursor-pointer">
          <Card className="border text-center border-green-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-green-500/50 hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-500 text-lg">Notes</CardTitle>
              <CardDescription className="text-green-500 text-2xl font-bold">{initialNotesCount}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div onClick={() => router.push("/urls")} className="cursor-pointer">
          <Card className="border text-center border-orange-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-orange-500/50 hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-500 text-lg">URLs</CardTitle>
              <CardDescription className="text-orange-500 text-2xl font-bold">{initialUrlsCount}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div onClick={() => router.push("/todos")} className="cursor-pointer">
          <Card className="border text-center border-cyan-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-cyan-500 text-lg">Todos</CardTitle>
              <CardDescription className="text-cyan-500 text-2xl font-bold">{initialTodosCount}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Card className="border text-center border-cyan-500 bg-white/5 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all your data by title..."
                autoComplete="off"
                className="pl-10 bg-slate-950/20 border-orange-500 text-white"
              />
            </div>
            <Select value={searchCategory} onValueChange={setSearchCategory}>
              <SelectTrigger className="w-full sm:w-[200px] bg-slate-950/20 border-orange-500 text-white hover:cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-950/40 border-cyan-500 backdrop-blur-sm">
                <SelectItem value="all" className="text-cyan-500 hover:cursor-pointer">
                  All
                </SelectItem>
                <SelectItem value="notes" className="text-white hover:cursor-pointer">
                  Notes
                </SelectItem>
                <SelectItem value="urls" className="text-white hover:cursor-pointer">
                  URLs
                </SelectItem>
                <SelectItem value="todos" className="text-white hover:cursor-pointer">
                  Todos
                </SelectItem>
                <SelectItem value="formulas" className="text-white hover:cursor-pointer">
                  Formulas
                </SelectItem>
                <SelectItem value="shortcuts" className="text-white hover:cursor-pointer">
                  Shortcuts
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {searchQuery && (
        <div className="space-y-8">
          {isLoading && <SearchingLoader />}

          {searchResults.notes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-500">Notes</h3>
              <NotesList notes={searchResults.notes} onEdit={() => {}} onUpdate={() => {}} />
            </div>
          )}

          {searchResults.urls.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-500">URLs</h3>
              <UrlsList urls={searchResults.urls} onEdit={() => {}} onUpdate={() => {}} />
            </div>
          )}

          {searchResults.todos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-500">Todos</h3>
              <div className="grid gap-4">
                {searchResults.todos.map((todo: any) => (
                  <Card key={todo.id} className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">{todo.title}</CardTitle>
                      {todo.description && (
                        <CardDescription className="text-slate-400">{todo.description}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {searchResults.formulas.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-500">Formulas</h3>
              <FormulaList formulas={searchResults.formulas} onEdit={() => {}} onUpdate={() => {}} />
            </div>
          )}

          {searchResults.shortcuts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-500">Shortcuts</h3>
              <ShortcutList shortcuts={searchResults.shortcuts} onEdit={() => {}} onUpdate={() => {}} />
            </div>
          )}

          {!isLoading &&
            searchResults.notes.length === 0 &&
            searchResults.urls.length === 0 &&
            searchResults.todos.length === 0 &&
            searchResults.formulas.length === 0 &&
            searchResults.shortcuts.length === 0 && (
              <p className="text-center text-red-500 py-8">No results found matching your search.</p>
            )}
        </div>
      )}
    </div>
  )
}
