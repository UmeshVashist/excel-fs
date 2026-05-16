"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X, Loader2, User, Check, History } from "lucide-react"
import { searchUsers, shareItem, getSharedWith } from "@/lib/sharing-actions"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Profile {
  id: string
  username: string | null
  email: string | null
}

interface SharedUser {
  id: string
  created_at: string
  permission: string
  profiles: {
    username: string | null
    email: string | null
  }
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

  useEffect(() => {
    if (open) {
      loadSharedUsers()
    }
  }, [open, resourceId, resourceType])

  const loadSharedUsers = async () => {
    const users = await getSharedWith(resourceId, resourceType)
    setSharedUsers(users)
  }

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
    }, 500)

    return () => clearTimeout(timer)
  }, [query])

  const handleToggleUser = (user: Profile) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
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
      userIds: selectedUsers.map(u => u.id),
      permission
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
      <DialogContent className="bg-slate-900/90 border-slate-800 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Share {resourceType.slice(0, -1)}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Search for users by username or email to share this item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by username or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-slate-950/50 border-slate-700 text-white"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                </div>
              )}
            </div>

            {error === "user not found" && (
              <p className="text-red-500 text-sm pl-1 font-medium">user not found</p>
            )}

            {results.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mt-1 shadow-xl">
                {results.map(user => {
                  const isEmailSearch = query.includes("@")
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleToggleUser(user)}
                      className="w-full flex flex-col items-start px-4 py-2 hover:bg-slate-700 text-left transition-colors border-b border-slate-700 last:border-0"
                    >
                      <span className="text-white font-medium">
                        {isEmailSearch ? (user.username || "No username") : user.email}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {isEmailSearch ? user.email : (user.username || "No username")}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <div key={user.id} className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-md text-xs flex items-center gap-1 border border-cyan-500/30">
                  {user.username || user.email}
                  <button onClick={() => handleToggleUser(user)}>
                    <X className="h-3 w-3 hover:text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Select value={permission} onValueChange={(v: any) => setPermission(v)}>
              <SelectTrigger className="w-[120px] bg-slate-950/50 border-slate-700 text-white cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="view" className="cursor-pointer">View</SelectItem>
                <SelectItem value="edit" className="cursor-pointer">Edit</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleShare}
              disabled={selectedUsers.length === 0 || isSharing}
              className="flex-1 btn-custom btn-custom-cyan"
            >
              {isSharing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Share
            </Button>
          </div>

          {sharedUsers.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-white text-sm font-semibold mb-3">Already shared with</h4>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                {sharedUsers.map((share: any) => (
                  <div key={share.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-medium">
                          {share.profiles?.username || "Unknown"}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {share.profiles?.email} • {format(new Date(share.created_at), "MMM d, HH:mm")}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                      {share.permission === "edit" ? "Editor" : "Viewer"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
