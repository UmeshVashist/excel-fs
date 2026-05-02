"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus } from "lucide-react"
import { UrlsList } from "@/components/urls-list"
import { UrlForm } from "@/components/url-form"
import { createClient } from "@/lib/supabase/client"

interface Url {
  id: string
  title: string
  url: string
  username: string | null
  password: string | null
  is_favorite: boolean
}

export function UrlsClient({
  initialUrls,
  userId,
  user,
}: {
  initialUrls: Url[]
  userId: string
  user: any
}) {
  const [urls, setUrls] = useState<Url[]>(initialUrls)
  const [filteredUrls, setFilteredUrls] = useState<Url[]>(initialUrls)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUrl, setEditingUrl] = useState<Url | null>(null)
  const supabase = createClient()

  const loadUrls = async () => {
    const { data } = await supabase
      .from("urls")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (data) {
      setUrls(data)
    }
  }

  useEffect(() => {
    let result = urls

    // Apply search filter
    if (searchQuery) {
      result = result.filter((u) => u.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Apply favorite filter
    if (filter === "favorites") {
      result = result.filter((u) => u.is_favorite)
    }

    setFilteredUrls(result)
  }, [searchQuery, filter, urls])

  const handleAdd = () => {
    setEditingUrl(null)
    setIsFormOpen(true)
  }

  const handleEdit = (url: Url) => {
    setEditingUrl(url)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingUrl(null)
    loadUrls()
  }

  const handleUpdate = () => {
    loadUrls()
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">URLs</h1>
          <p className="text-cyan-500">Manage your URLs and credentials</p>
        </div>
        <Button
          onClick={handleAdd}
          className="w-full md:w-auto bg-slate-950/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-blue-600/50"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add URL
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search URLs by title..."
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
              All URLs
            </SelectItem>
            <SelectItem value="favorites" className="text-white">
              Favorites
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <UrlsList urls={filteredUrls} onEdit={handleEdit} onUpdate={handleUpdate} />

      <UrlForm open={isFormOpen} onOpenChange={handleFormClose} url={editingUrl} userId={userId} />
    </div>
  )
}
