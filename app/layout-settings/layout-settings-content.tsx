"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function LayoutSettingsContent() {
  const [theme, setTheme] = useState("default")
  const [sidebar, setSidebar] = useState("expanded")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase.from("profiles").select("layout_settings").eq("id", user.id).single()

      if (error) throw error

      if (data?.layout_settings) {
        setTheme(data.layout_settings.theme || "default")
        setSidebar(data.layout_settings.sidebar || "expanded")
      }
    } catch (error) {
      console.error("[v0] Failed to load layout settings:", error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      const layoutSettings = { theme, sidebar }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ layout_settings: layoutSettings })
        .eq("id", user.id)

      if (updateError) throw updateError

      const { error: historyError } = await supabase.from("layout_history").insert({
        user_id: user.id,
        layout_config: layoutSettings,
      })

      if (historyError) throw historyError

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Layout Settings</h1>
        <p className="text-slate-400">Customize your application layout preferences</p>
      </div>

      <Card className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-2xl transition-all hover:shadow-lg hover:shadow-white/10">
        <CardHeader>
          <CardTitle className="text-white">Appearance</CardTitle>
          <CardDescription className="text-slate-400">Configure how the application looks and feels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="theme" className="text-slate-300">
              Theme
            </Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme" className="bg-slate-900/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sidebar" className="text-slate-300">
              Sidebar
            </Label>
            <Select value={sidebar} onValueChange={setSidebar}>
              <SelectTrigger id="sidebar" className="bg-slate-900/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="expanded">Expanded</SelectItem>
                <SelectItem value="collapsed">Collapsed</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">Settings saved successfully!</p>}

          <Button
            onClick={handleSave}
            className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-all hover:shadow-lg hover:shadow-blue-600 border border-blue-500 text-blue-500 hover:text-blue-500"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
