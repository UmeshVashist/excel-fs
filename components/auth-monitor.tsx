"use client"

import { useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes (synced with middleware)
const PASSWORD_AGE_LIMIT = 90 * 24 * 60 * 60 * 1000 // 90 days

export function AuthMonitor() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }, [supabase, router])

  useEffect(() => {
    if (pathname.startsWith("/auth") || pathname === "/") return

    let timeoutId: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(logout, INACTIVITY_TIMEOUT)
    }

    // Monitor user activity
    window.addEventListener("mousemove", resetTimer)
    window.addEventListener("keypress", resetTimer)
    window.addEventListener("scroll", resetTimer)
    window.addEventListener("click", resetTimer)

    resetTimer()

    // Check password age
    const checkPasswordAge = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("last_password_change")
        .eq("id", user.id)
        .single()

      if (profile?.last_password_change) {
        const lastChange = new Date(profile.last_password_change).getTime()
        const now = new Date().getTime()

        if (now - lastChange > PASSWORD_AGE_LIMIT && pathname !== "/settings") {
          // Redirect to settings to change password
          router.push("/settings?expired=true")
        }
      }
    }

    checkPasswordAge()

    return () => {
      window.removeEventListener("mousemove", resetTimer)
      window.removeEventListener("keypress", resetTimer)
      window.removeEventListener("scroll", resetTimer)
      window.removeEventListener("click", resetTimer)
      clearTimeout(timeoutId)
    }
  }, [pathname, logout, supabase, router])

  return null
}
