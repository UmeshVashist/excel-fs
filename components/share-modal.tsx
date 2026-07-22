"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X, Loader2, User, Trash2 } from "lucide-react"
import { searchUsers, shareItem, getSharedWith, removeShare, updateSharePermission } from "@/lib/sharing-actions"
import { format } from "date-fns"

interface Profile {
  id: string
  username: string | null
  email: string | null
}

export function ShareModal({
  open,
  onOpenChange,
  resourceId,
  resourceType,
  ownerId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceId: string
  resourceType: string
  ownerId: string
}) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsLoading] = useState(false)
  const [results, setResults] = useState<Profile[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])
  const [permission, setPermission] = useState<"view" | "edit">("view")
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sharedUsers, setSharedUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (open) {
      loadSharedUsers()
      setQuery("")
      setSearchQuery("")
    }
  }, [open, resourceId, resourceType])

  const loadSharedUsers = async () => {
    const users = await getSharedWith(resourceId, resourceType)
    setSharedUsers(users)
  }

  const handleRemoveShare = async (shareId: string) => {
    if (confirm("Are you sure you want to remove this user's access?")) {
      const res = await removeShare(shareId)
      if (res.success) {
        loadSharedUsers()
      } else {
        alert(res.error || "Failed to remove access")
      }
    }
  }

  const handleUpdatePermission = async (shareId: string, newPermission: "view" | "edit") => {
    const res = await updateSharePermission(shareId, newPermission)
    if (res.success) {
      loadSharedUsers()
    } else {
      alert(res.error || "Failed to update permission")
    }
  }

  const filteredSharedUsers = sharedUsers.filter((share) => {
    if (!searchQuery) return true
    const name = share.profiles?.username?.toLowerCase() || ""
    const email = share.profiles?.email?.toLowerCase() || ""
    const q = searchQuery.toLowerCase()
    return name.includes(q) || email.includes(q)
  })

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setError(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      const res = await searchUsers(query)
      setIsLoading(false)

      if (res.error) {
        setError(res.error)
      } else if (res.profiles && res.profiles.length === 0) {
        setError("user not found")
      } else {
        setResults(res.profiles || [])
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  const handleToggleUser = (user: Profile) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
    setQuery("")
    setResults([])
  }

  const handleShare = async () => {
    if (selectedUsers.length === 0) return

    setIsSharing(true)
    const res = await shareItem({
      resourceId,
      resourceType,
      ownerId,
      userIds: selectedUsers.map((u) => u.id),
      permission,
    })
    setIsSharing(false)

    if (res.success) {
      setSelectedUsers([])
      setQuery("")
      loadSharedUsers()
    } else {
      setError(res.error || "Failed to share")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 border-slate-800 backdrop-blur-2xl sm:max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">Share {resourceType.slice(0, -1)}</DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Search for users by username or email to share this item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by username or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-slate-950/60 border-slate-700/80 text-white h-10 text-sm rounded-xl focus:border-cyan-500 transition-all"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                </div>
              )}
            </div>

            {error === "user not found" && (
              <p className="text-red-400 text-xs pl-1 font-medium">user not found</p>
            )}

            {results.length > 0 && (
              <div className="absolute left-0 right-0 z-50 bg-slate-950/95 border border-slate-700/90 rounded-xl mt-1.5 shadow-2xl backdrop-blur-2xl max-h-52 overflow-y-auto custom-scrollbar share-user-result-box">
                {results.map((user) => {
                  const isEmailSearch = query.includes("@")
                  const primaryText = isEmailSearch ? user.username || user.email : user.username || user.email
                  const secondaryText = isEmailSearch ? user.email : user.email !== user.username ? user.email : ""

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleToggleUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cyan-500/15 text-left transition-all border-b border-slate-800/60 last:border-0 cursor-pointer group share-user-result-item"
                    >
                      <div className="h-8 w-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-slate-100 font-semibold text-sm group-hover:text-cyan-300 transition-colors truncate">
                          {primaryText}
                        </span>
                        {secondaryText && (
                          <span className="text-slate-400 text-xs font-mono truncate">{secondaryText}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-cyan-500/40 shadow-sm"
                >
                  <span>{user.username || user.email}</span>
                  <button onClick={() => handleToggleUser(user)} className="hover:text-white transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Select value={permission} onValueChange={(v: any) => setPermission(v)}>
              <SelectTrigger className="w-[120px] bg-slate-900/60 backdrop-blur-md border-white/15 text-white h-10 rounded-xl hover:border-cyan-500/50 transition-all cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/85 backdrop-blur-xl border-white/15 shadow-2xl">
                <SelectItem value="view" className="cursor-pointer text-purple-400 font-medium">
                  View
                </SelectItem>
                <SelectItem value="edit" className="cursor-pointer text-cyan-400 font-medium">
                  Edit
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleShare}
              disabled={selectedUsers.length === 0 || isSharing}
              className="flex-1 btn-custom btn-custom-cyan h-10"
            >
              {isSharing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Share
            </Button>
          </div>

          {sharedUsers.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white text-sm font-semibold">Already shared with</h4>
                <div className="relative w-1/2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search shared..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-slate-950/60 border-slate-700/80 text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredSharedUsers.length > 0 ? (
                  filteredSharedUsers.map((share: any) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 transition-all hover:border-cyan-500/30 shared-user-card group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-slate-100 text-xs font-semibold truncate">
                            {share.profiles?.username || share.profiles?.email || "Unknown"}
                          </span>
                          <span className="text-slate-400 text-[10px] truncate font-mono">
                            {share.profiles?.email && share.profiles?.email !== share.profiles?.username
                              ? `${share.profiles.email} • `
                              : ""}
                            {format(new Date(share.created_at), "MMM d, HH:mm")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={share.permission}
                          onValueChange={(v: "view" | "edit") => handleUpdatePermission(share.id, v)}
                        >
                          <SelectTrigger className="h-7 w-[85px] bg-slate-900/60 backdrop-blur-md border-white/15 text-[10px] text-slate-200 rounded-lg hover:border-cyan-500/50 transition-all cursor-pointer">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900/85 backdrop-blur-xl border-white/15 shadow-2xl">
                            <SelectItem value="view" className="text-[10px] text-purple-400 cursor-pointer">
                              Viewer
                            </SelectItem>
                            <SelectItem value="edit" className="text-[10px] text-cyan-400 cursor-pointer">
                              Editor
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => handleRemoveShare(share.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Remove access"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs italic">No matching users found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
