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

    const filtered = history.filter((item) => {
      const username = item.profiles?.username?.toLowerCase() || ""
      const email = item.profiles?.email?.toLowerCase() || ""
      const query = searchQuery.toLowerCase()
      return username.includes(query) || email.includes(query)
    })
    setFilteredHistory(filtered)
  }, [searchQuery, history])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 border-slate-800 backdrop-blur-2xl sm:max-w-md p-0 overflow-hidden shadow-2xl">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white text-xl flex items-center gap-2 font-bold">
              <History className="h-5 w-5 text-cyan-400" />
              Action History
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Track all changes and actions made to this item.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-slate-950/60 border-slate-700/80 text-white h-10 text-sm rounded-xl focus:border-cyan-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="relative pl-6 border-l-2 border-cyan-500/40 pb-2 last:pb-0">
                    <div className="absolute left-[-7px] top-1.5 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.7)]" />
                    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 backdrop-blur-md transition-all hover:border-cyan-500/40 history-item-card">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <User className="h-3.5 w-3.5 text-cyan-400" />
                          {item.profiles?.username || item.profiles?.email || "Unknown"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {format(new Date(item.created_at), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">
                        <span className="capitalize font-bold text-cyan-400">{item.action}</span>
                        {item.field_name && (
                          <>
                            {" "}
                            <span className="text-slate-400">field</span>{" "}
                            <span className="text-purple-400 font-mono font-semibold">{item.field_name}</span>
                          </>
                        )}
                      </p>
                      {item.new_value && (
                        <div className="mt-1 p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs font-mono text-slate-300 break-all leading-relaxed history-value-box">
                          {item.new_value}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm italic">
                {searchQuery ? "No matching history found." : "No history found for this item."}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
