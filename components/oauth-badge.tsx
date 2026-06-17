"use client"

import { Github } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface OAuthBadgeProps {
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function OAuthBadge({ size = "md", showLabel = true }: OAuthBadgeProps) {
  const [oauthProvider, setOauthProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOAuthProvider = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("oauth_provider")
            .eq("id", user.id)
            .single()

          setOauthProvider(profile?.oauth_provider || null)
        }
      } catch (error) {
        console.error("Error fetching OAuth provider:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOAuthProvider()
  }, [])

  if (loading || !oauthProvider) {
    return null
  }

  const isGmail = oauthProvider === "google"
  const isGithub = oauthProvider === "github"

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        flex items-center gap-2 rounded-full
        ${sizeClasses[size]}
        ${
          isGmail
            ? "bg-gradient-to-r from-red-500/20 to-yellow-500/20 border border-yellow-500/30"
            : "bg-gradient-to-r from-gray-700/30 to-gray-900/30 border border-gray-600/50"
        }
      `}
    >
      {isGmail ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="4" width="4" height="10" fill="#EA4335" rx="0.5" />
          <rect x="7" y="4" width="4" height="10" fill="#4285F4" rx="0.5" />
          <rect x="12" y="4" width="4" height="10" fill="#FBBC05" rx="0.5" />
          <rect x="17" y="4" width="4" height="10" fill="#4285F4" rx="0.5" />
          <polygon points="2,14 6,17 12,12 18,17 22,14 12,22" fill="#34A853" />
        </svg>
      ) : (
        <Github className="w-4 h-4 text-gray-300" />
      )}
      {showLabel && (
        <span className={isGmail ? "text-yellow-300 font-semibold" : "text-gray-200 font-semibold"}>
          {isGmail ? "Gmail" : "GitHub"}
        </span>
      )}
    </motion.div>
  )
}

export default OAuthBadge
