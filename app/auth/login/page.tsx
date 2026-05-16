"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { loginAction, loginWithGmail, loginWithGithub } from "./actions"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, Github } from "lucide-react"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
    
    if (searchParams.get("timeout") === "true") {
      setError("Your session has expired. Please login again.")
    } else if (searchParams.get("expired") === "true") {
      setError("Your password has expired. Please login to change it.")
    }

    if (
      searchParams.get("expired") === "true" ||
      searchParams.get("timeout") === "true"
    ) {
      // Use router.replace to clean up URL without full reload yet
      router.replace("/auth/login")
    }
  }, [searchParams, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Use server action for username/email login
      const result = await loginAction(identifier, password)

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.passwordExpired) {
        router.push("/auth/reset-password?expired=true")
        return
      }

      // Use window.location.href for a full reload to ensure cookies are synchronized
      // This fixes the "must login twice" issue after session timeout
      window.location.href = "/dashboard"
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setOauthLoading(provider)
    setError(null)

    try {
      if (provider === "google") {
        const result = await loginWithGmail()
        if (result.error) {
          if (result.error.includes("Unsupported provider")) {
            throw new Error("❌ Google OAuth is not enabled in Supabase. Please configure it first. See docs/OAUTH_ERROR_QUICK_FIX.md")
          }
          throw new Error(result.error)
        }
        if (result.url) {
          window.location.href = result.url
        }
      } else if (provider === "github") {
        const result = await loginWithGithub()
        if (result.error) {
          if (result.error.includes("Unsupported provider")) {
            throw new Error("❌ GitHub OAuth is not enabled in Supabase. Please configure it first. See docs/OAUTH_ERROR_QUICK_FIX.md")
          }
          throw new Error(result.error)
        }
        if (result.url) {
          window.location.href = result.url
        }
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "OAuth login failed"
      setError(errorMsg)
      setOauthLoading(null)
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94],
          scale: { duration: 0.5 }
        }}
        className="w-full max-w-md"
      >
        <Card className="border border-slate-700/50 bg-slate-950/30 backdrop-blur-xl shadow-2xl shadow-slate-900/50 hover:shadow-slate-900/70 transition-all duration-500 hover:border-slate-600/50 group">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <CardHeader className="text-center pb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
              >
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent mb-2">
                  Welcome
                </CardTitle>
              </motion.div>
              <CardDescription className="text-cyan-400/80 text-lg">
                Access your account with email or username
              </CardDescription>
            </CardHeader>
          </motion.div>
          <CardContent>
            <form onSubmit={handleLogin}>
              <motion.div
                className="flex flex-col gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {/* OAuth Buttons at Top */}
                <motion.div
                  className="grid grid-cols-2 gap-3"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin("google")}
                    disabled={oauthLoading === "google" || isLoading}
                    className="btn-custom btn-custom-purple w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {oauthLoading === "google" ? (
                      <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    <span className="hidden sm:inline text-sm text-white">Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin("github")}
                    disabled={oauthLoading === "github" || isLoading}
                    className="btn-custom btn-custom-purple w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {oauthLoading === "github" ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                    ) : (
                      <Github className="w-5 h-5 text-white group-hover:text-white transition-colors" />
                    )}
                    <span className="hidden sm:inline text-sm text-white">GitHub</span>
                  </button>
                </motion.div>

                {/* Divider */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600/30"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-950/30 text-slate-400">Or Email or Username</span>
                  </div>
                </motion.div>

                {/* Email/Username Field */}
                <motion.div
                  className="grid gap-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.65, duration: 0.4 }}
                >
                  <Label htmlFor="identifier" className="text-slate-300 font-medium">
                    Email or Username
                  </Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Enter your email or username"
                    required
                    autoComplete="off"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-300 hover:border-slate-500/50"
                  />
                </motion.div>

                {/* Password Field */}
                <motion.div
                  className="grid gap-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <Label htmlFor="password" className="text-slate-300 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      placeholder="Enter your password"
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-300 hover:border-slate-500/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="text-sm text-red-300 bg-red-500/15 border border-red-500/30 rounded-lg p-3 space-y-2"
                    >
                      <p className="font-semibold">{error.includes("❌") ? error : `⚠️ ${error}`}</p>
                      {error.includes("Unsupported provider") && (
                        <p className="text-xs text-red-200 mt-2">
                          💡 <strong>Quick Fix:</strong> Open <code className="bg-red-900/30 px-1 py-0.5 rounded">docs/OAUTH_ERROR_QUICK_FIX.md</code> for step-by-step setup instructions
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sign In Button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.75, duration: 0.4 }}
                >
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-custom btn-custom-blue w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </motion.div>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        Sign In
                      </motion.span>
                    )}
                  </button>
                </motion.div>

                {/* Forgot Password & Create Account */}
                <motion.div
                  className="mt-2 grid gap-3 sm:grid-cols-2 text-sm"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.85, duration: 0.4 }}
                >
                  <Link
                    href="/auth/forgot-password"
                    className="btn-custom btn-custom-red"
                  >
                    Forgot password?
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="btn-custom btn-custom-green"
                  >
                    Create Account
                  </Link>
                </motion.div>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
