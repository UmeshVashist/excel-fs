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
import { AlertCircle, Eye, EyeOff, UserCircle, Lock, AlertTriangle } from "lucide-react"

interface SettingsModalsProps {
  type: "profile" | "password" | "danger" | null
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

  const router = useRouter()
  const supabase = createClient()

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
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username, email, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      if (profileError) throw profileError

      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email })
        if (emailError) throw emailError
      }

      if (onUpdate) onUpdate()
      setMessage({ type: "success", text: "Profile updated successfully!" })
      setTimeout(() => onOpenChange(false), 2000)
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

  const renderContent = () => {
    switch (type) {
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
              className="w-full bg-slate-950/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-blue-600/50"
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
              className="w-full bg-slate-950/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-blue-600/50"
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
              className="w-full bg-slate-950/20 text-red-500 border border-red-500/50 hover:bg-red-500/20 hover:border-red-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-red-600/50"
            >
              {isLoading ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  const getTitle = () => {
    switch (type) {
      case "profile": return "Profile Information"
      case "password": return "Change Password"
      case "danger": return "Danger Zone"
      default: return ""
    }
  }

  const getDescription = () => {
    switch (type) {
      case "profile": return "Update your username and email"
      case "password": return "Update your account password"
      case "danger": return "Permanently delete your account and all data"
      default: return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900/60 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden [&_button[data-slot=dialog-close]]:text-white [&_button[data-slot=dialog-close]]:opacity-100 [&_button[data-slot=dialog-close]]:hover:bg-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            {type === "profile" && <UserCircle className="h-5 w-5 text-blue-400" />}
            {type === "password" && <Lock className="h-5 w-5 text-purple-400" />}
            {type === "danger" && <AlertTriangle className="h-5 w-5 text-red-500" />}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        <div className="relative z-10">
          {message && (
            <div className={`p-3 rounded-lg border flex items-center gap-2 mb-4 ${
              message.type === "success" ? "bg-green-900/20 border-green-700 text-green-400" : "bg-red-900/20 border-red-700 text-red-400"
            }`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-xs">{message.text}</p>
            </div>
          )}
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
