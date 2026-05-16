"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { AlertCircle, Eye, EyeOff, UserCircle, Lock, AlertTriangle, Trash2, RotateCcw, CheckSquare, Square, RefreshCw, Search, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mutate } from "swr"

interface DeletedItem {
  id: string
  type: "formula" | "note" | "url" | "todo" | "shortcut"
  title: string
  deleted_at: string
}

interface SettingsModalsProps {
  type: "profile" | "password" | "danger" | "recycle-bin" | null
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
  onUpdate?: () => void
}

export function SettingsModals({ type, open, onOpenChange, user, onUpdate }: SettingsModalsProps) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [binSearchQuery, setBinSearchQuery] = useState("")

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (message && message.type === "success") {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const filteredBinItems = deletedItems.filter(item => 
    item.title.toLowerCase().includes(binSearchQuery.toLowerCase())
  )

  const fetchDeletedItems = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const tables: ("formulas" | "notes" | "urls" | "todos" | "shortcuts")[] = ["formulas", "notes", "urls", "todos", "shortcuts"]
      let allDeleted: DeletedItem[] = []

      for (const table of tables) {
        // First, handle auto-delete (permanently remove items older than 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        await supabase
          .from(table)
          .delete()
          .eq("user_id", user.id)
          .eq("is_deleted", true)
          .lt("deleted_at", thirtyDaysAgo.toISOString())

        // Fetch deleted items for the current table
        const { data, error } = await supabase
          .from(table)
          .select("id, title, deleted_at")
          .eq("user_id", user.id)
          .eq("is_deleted", true)
        
        // Handle shortcuts separately if they have different column names
        // But checking shortcut-list.tsx, it uses 'title'
        if (data && !error) {
          allDeleted = [...allDeleted, ...data.map(item => ({
            id: item.id,
            type: table.slice(0, -1) as any, // Remove 's' for singular type
            title: item.title,
            deleted_at: item.deleted_at
          }))]
        } else if (error) {
          console.error(`Error fetching from ${table}:`, error)
        }
      }

      setDeletedItems(allDeleted.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()))
    } catch (error) {
      console.error("Error fetching deleted items:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open && type === "recycle-bin") {
      fetchDeletedItems()
      setSelectedIds(new Set())
    }
  }, [open, type])

  const handleSelectAll = () => {
    if (selectedIds.size === filteredBinItems.length && filteredBinItems.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredBinItems.map(item => item.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleRestore = async () => {
    if (selectedIds.size === 0) return
    setIsProcessing(true)
    try {
      const itemsToRestore = deletedItems.filter(item => selectedIds.has(item.id))
      
      for (const item of itemsToRestore) {
        const table = item.type === "shortcut" ? "shortcuts" : `${item.type}s`
        await supabase
          .from(table)
          .update({ is_deleted: false, deleted_at: null })
          .eq("id", item.id)
      }

      setMessage({ type: "success", text: `Restored ${selectedIds.size} items successfully!` })
      fetchDeletedItems()
      setSelectedIds(new Set())
      
      // Refresh global SWR cache for todos if any restored
      if (itemsToRestore.some(item => item.type === "todo")) {
        mutate(`todos-${user.id}`)
      }
      
      router.refresh()
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to restore items" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePermanentDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.size} items? This action cannot be undone.`)) return
    
    setIsProcessing(true)
    try {
      const itemsToDelete = deletedItems.filter(item => selectedIds.has(item.id))
      
      for (const item of itemsToDelete) {
        const table = item.type === "shortcut" ? "shortcuts" : `${item.type}s`
        await supabase
          .from(table)
          .delete()
          .eq("id", item.id)
      }

      setMessage({ type: "success", text: `Permanently deleted ${selectedIds.size} items!` })
      fetchDeletedItems()
      setSelectedIds(new Set())

      // Refresh global SWR cache for todos if any deleted
      if (itemsToDelete.some(item => item.type === "todo")) {
        mutate(`todos-${user.id}`)
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to delete items" })
    } finally {
      setIsProcessing(false)
    }
  }

  const getDaysRemaining = (deletedAt: string) => {
    const deleteDate = new Date(deletedAt)
    const expiryDate = new Date(deleteDate)
    expiryDate.setDate(deleteDate.getDate() + 30)
    
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "formula":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "shortcut":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "note":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "url":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      case "todo":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20"
      default:
        return "bg-white/5 text-slate-500 border-white/5"
    }
  }

  useEffect(() => {
    if (user) {
      setEmail(user.email || "")
      const fetchProfile = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single()
        if (data) setUsername(data.username)
      }
      fetchProfile()
    }
  }, [user, supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      if (email !== user.email) {
        // Request email update in Supabase Auth
        // This will send confirmation emails
        const { error: emailError } = await supabase.auth.updateUser({ email })
        if (emailError) throw emailError
        
        setMessage({ 
          type: "success", 
          text: "Confirmation emails sent! Please check both your current and new email addresses to confirm the change." 
        })
      } else {
        // Only update username if email hasn't changed
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username, updated_at: new Date().toISOString() })
          .eq("id", user.id)

        if (profileError) throw profileError
        
        if (onUpdate) onUpdate()
        setMessage({ type: "success", text: "Profile updated successfully!" })
        setTimeout(() => onOpenChange(false), 2000)
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update profile" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      setIsLoading(false)
      return
    }

    try {
      if (!user?.email) throw new Error("User email not found")
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) throw new Error("Current password is incorrect")

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      setMessage({ type: "success", text: "Password updated successfully!" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => onOpenChange(false), 2000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update password" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", user.id)
      if (profileError) throw profileError

      await supabase.auth.signOut()
      onOpenChange(false)
      router.push("/auth/login")
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to delete account" })
      setIsLoading(false)
    }
  }

  const getTitle = () => {
    switch (type) {
      case "profile": return "Profile Information"
      case "password": return "Change Password"
      case "danger": return "Danger Zone"
      case "recycle-bin": return "Recycle Bin"
      default: return ""
    }
  }

  const getDescription = () => {
    switch (type) {
      case "profile": return "Update your username and email"
      case "password": return "Update your account password"
      case "danger": return "Permanently delete your account and all data"
      case "recycle-bin": return "Restore or permanently delete recently deleted items"
      default: return ""
    }
  }

  const renderContent = () => {
    switch (type) {
      case "recycle-bin":
        return (
          <div className="space-y-4 pt-2">
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/30 animate-in fade-in zoom-in-95 duration-200">
                <span className="text-sm font-medium text-blue-100 ml-1">
                  {selectedIds.size} selected
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRestore}
                    disabled={isProcessing}
                    className="h-8 btn-custom btn-custom-cyan rounded-lg gap-2 px-2"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-cyan-500" />
                    <span className="text-xs">Restore</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePermanentDelete}
                    disabled={isProcessing}
                    className="h-8 btn-custom btn-custom-red rounded-lg gap-2 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-xs">Delete</span>
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-1">
              <div className="flex items-center gap-2 shrink-0">
                <Checkbox 
                  id="select-all" 
                  checked={filteredBinItems.length > 0 && selectedIds.size === filteredBinItems.length}
                  onCheckedChange={handleSelectAll}
                  className="h-4 w-4 border-slate-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 rounded"
                />
                <Label htmlFor="select-all" className="text-xs font-medium text-slate-400 cursor-pointer select-none whitespace-nowrap">
                  Select All
                </Label>
              </div>

              <div className="relative flex-1 group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <Input
                  placeholder="Search in bin..."
                  value={binSearchQuery}
                  onChange={(e) => setBinSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-8 bg-white/5 border-white/10 text-xs text-white focus:ring-1 focus:ring-blue-500/50 rounded-lg"
                />
                {binSearchQuery && (
                  <button
                    onClick={() => setBinSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={fetchDeletedItems}
                disabled={isLoading}
                className="text-slate-400 hover:text-purple-500 hover:bg-white/5 h-8 w-8 p-0 rounded-lg shrink-0 transition-colors"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              </Button>
            </div>

            <ScrollArea className="h-[380px] w-full rounded-xl border border-white/5 bg-black/10 backdrop-blur-sm overflow-hidden">
              {filteredBinItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-500 space-y-3 px-4 text-center">
                  <div className="p-3 rounded-full bg-white/5 border border-white/5">
                    <Trash2 className="h-6 w-6 opacity-20" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">
                      {binSearchQuery ? "No results found" : "Recycle bin is empty"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {filteredBinItems.map((item) => {
                    const daysLeft = getDaysRemaining(item.deleted_at)
                    const isSelected = selectedIds.has(item.id)
                    return (
                      <div 
                        key={item.id}
                        className={cn(
                          "group flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer",
                          isSelected 
                            ? "bg-blue-500/10 border-blue-500/30" 
                            : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10"
                        )}
                        onClick={() => toggleSelect(item.id)}
                      >
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(item.id)}
                          className="h-4 w-4 border-slate-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 rounded shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-semibold truncate transition-colors",
                            isSelected ? "text-white" : "text-slate-200"
                          )}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={cn(
                              "text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border",
                              getTypeStyles(item.type)
                            )}>
                              {item.type}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(item.deleted_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-1">
                          <div className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold border",
                            daysLeft <= 5 
                              ? "bg-red-500/10 text-red-500 border-red-500/30" 
                              : "bg-red-500/5 text-red-500 border-red-500/10"
                          )}>
                            {daysLeft}d
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
            <p className="text-[12px] text-red-500 text-center italic px-4 leading-relaxed">
              Items are automatically deleted after 30 days.
            </p>
          </div>
        )
      case "profile":
        return (
          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-custom btn-custom-blue"
            >
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        )
      case "password":
        return (
          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-slate-300">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-700 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-slate-300">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-700 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-slate-300">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-700 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-custom btn-custom-blue"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        )
      case "danger":
        return (
          <div className="space-y-4 pt-4">
            <p className="text-red-500 text-sm">
              For any Information / Query / Support / Feedback regarding Excel_F&S, Please Contact at link.inv.help@gmail.com
            </p>
            <p className="text-sm text-slate-400">
              Once you delete your account, there is no going back. This will permanently delete your profile, formulas, and shortcuts.
            </p>
            <Button
              onClick={handleDeleteAccount}
              disabled={isLoading}
              className="w-full btn-custom btn-custom-red"
            >
              {isLoading ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
         "bg-slate-900/40 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden p-0 gap-0",
         type === "recycle-bin" ? "sm:max-w-[480px] w-[95vw]" : "sm:max-w-[425px] w-[95vw]",
        "[&_button[data-slot=dialog-close]]:text-red-500 [&_button[data-slot=dialog-close]]:opacity-100 [&_button[data-slot=dialog-close]]:hover:text-red-400 [&_button[data-slot=dialog-close]]:hover:bg-white/10 [&_button[data-slot=dialog-close]]:right-4 [&_button[data-slot=dialog-close]]:top-4 [&_button[data-slot=dialog-close]]:z-50"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
        
        <div className="p-6 pb-0 relative z-10">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl bg-gradient-to-br shadow-inner",
                type === "profile" && "from-blue-500/20 to-blue-600/10 text-blue-400",
                type === "password" && "from-purple-500/20 to-purple-600/10 text-purple-400",
                type === "danger" && "from-red-500/20 to-red-600/10 text-red-500",
                type === "recycle-bin" && "from-orange-500/20 to-orange-600/10 text-orange-500",
              )}>
                {type === "profile" && <UserCircle className="h-6 w-6" />}
                {type === "password" && <Lock className="h-6 w-6" />}
                {type === "danger" && <AlertTriangle className="h-6 w-6" />}
                {type === "recycle-bin" && <Trash2 className="h-6 w-6" />}
              </div>
              {getTitle()}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm pl-11">
              {getDescription()}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 pt-2 relative z-10">
          {message && (
            <div className={cn(
              "p-3 rounded-xl border flex items-center gap-3 mb-4 animate-in fade-in slide-in-from-top-2",
              message.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
            )}>
              <div className={cn(
                "p-1 rounded-full",
                message.type === "success" ? "bg-green-500/20" : "bg-red-500/20"
              )}>
                <AlertCircle className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium">{message.text}</p>
            </div>
          )}
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
