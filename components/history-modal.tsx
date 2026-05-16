"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getItemHistory } from "@/lib/sharing-actions"
import { format } from "date-fns"
import { Loader2, History, User, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

export function HistoryModal({
  open,
  onOpenChange,
  resourceId,
  resourceType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceId: string
  resourceType: string
}) {
  const [history, setHistory] = useState<any[]>([])
  const [filteredHistory, setFilteredHistory] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadHistory()
      setSearchQuery("")
    }
  }, [open, resourceId, resourceType])

  const loadHistory = async () => {
    setIsLoading(true)
    const data = await getItemHistory(resourceId, resourceType)
    setHistory(data)
    setFilteredHistory(data)
    setIsLoading(false)
  }

  useEffect(() => {
    if (!searchQuery) {
      setFilteredHistory(history)
      return
    }

    const filtered = history.filter(item => {
      const username = item.profiles?.username?.toLowerCase() || ""
      const email = item.profiles?.email?.toLowerCase() || ""
      const query = searchQuery.toLowerCase()
      return username.includes(query) || email.includes(query)
    })
    setFilteredHistory(filtered)
  }, [searchQuery, history])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/90 border-slate-800 backdrop-blur-xl sm:max-w-md p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <History className="h-5 w-5 text-cyan-500" />
              Action History
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Track all changes and actions made to this item.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-slate-950/50 border-slate-800 text-white h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="relative pl-6 border-l border-slate-800 pb-4 last:pb-0">
                    <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium text-slate-300">
                          <User className="h-2.5 w-2.5" />
                          {item.profiles?.username || item.profiles?.email || "Unknown"}
                        </span>
                        <span>{format(new Date(item.created_at), "MMM d, HH:mm")}</span>
                      </div>
                      <p className="text-xs text-white">
                        <span className="capitalize font-semibold text-cyan-400">{item.action}</span>
                        {item.field_name && (
                          <>
                            {" "}<span className="text-slate-500">field</span>{" "}
                            <span className="text-purple-400 font-mono">{item.field_name}</span>
                          </>
                        )}
                      </p>
                      {item.new_value && (
                        <div className="mt-1 p-2 rounded bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 break-all leading-relaxed">
                          {item.new_value}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm italic">
                {searchQuery ? "No matching history found." : "No history found for this item."}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
