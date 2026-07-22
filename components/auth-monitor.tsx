"use client"

import { useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useClerk, useUser } from "@clerk/nextjs"
import { createClient } from "@/lib/supabase/client"

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export function AuthMonitor() {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useClerk()
  const { user } = useUser()
  const supabase = createClient()

  const logout = useCallback(async () => {
    await signOut({ redirectUrl: "/auth/login" })
  }, [signOut])

  useEffect(() => {
    if (pathname.startsWith("/auth") || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname === "/") return

    let timeoutId: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(logout, INACTIVITY_TIMEOUT)
    }

    window.addEventListener("mousemove", resetTimer)
    window.addEventListener("keypress", resetTimer)
    window.addEventListener("scroll", resetTimer)
    window.addEventListener("click", resetTimer)

    resetTimer()

    return () => {
      window.removeEventListener("mousemove", resetTimer)
      window.removeEventListener("keypress", resetTimer)
      window.removeEventListener("scroll", resetTimer)
      window.removeEventListener("click", resetTimer)
      clearTimeout(timeoutId)
    }
  }, [pathname, logout])

  return null
}
