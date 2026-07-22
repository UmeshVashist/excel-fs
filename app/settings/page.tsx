"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, UserProfile } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle } from "lucide-react"

export default function SettingsPage() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/auth/login")
      return
    }

    if (clerkUser) {
      setEmail(clerkUser.primaryEmailAddress?.emailAddress || "")
      
      const loadProfile = async () => {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", clerkUser.id)
          .single()

        if (profileData) {
          setUsername(profileData.username)
        } else {
          setUsername(clerkUser.username || clerkUser.firstName || "")
        }
      }
      loadProfile()
    }
  }, [isLoaded, isSignedIn, clerkUser, router, supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkUser) return
    setIsLoading(true)
    setMessage(null)

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: clerkUser.id, username, email, updated_at: new Date().toISOString() })

      if (profileError) throw profileError

      setMessage({ type: "success", text: "Profile updated successfully!" })
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded || !isSignedIn || !clerkUser) return null

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-orange-500 mb-2">Settings</h1>
        <p className="text-cyan-500">Manage your account settings</p>
        <p className="text-red-500 mt-2 text-sm">
          For any Information / Query / Support / Feedback regarding Excel_F&S, Please Contact at link.inv.help@gmail.com
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-900/20 border-green-700 text-green-400"
              : "bg-red-900/20 border-red-700 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{message.text}</p>
          </div>
        </div>
      )}

      <Card className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
          <CardDescription className="text-slate-400">Update your username</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-slate-900/50 border-slate-700 text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500">Email is managed through your Clerk account.</p>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-slate-950/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-blue-600/50"
            >
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <UserProfile
          appearance={{
            baseTheme: dark,
            elements: {
              card: "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl",
            },
          }}
        />
      </div>
    </div>
  )
}
