"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { loginAction } from "./actions"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const clearSession = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    clearSession()
  }, [])

  useEffect(() => {
    if (
      searchParams.get("expired") === "true" ||
      searchParams.get("timeout") === "true"
    ) {
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

      router.replace("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
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
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-2">
                  Welcome Back
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
                <motion.div
                  className="grid gap-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
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
                <motion.div
                  className="grid gap-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
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
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
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
                <motion.div
                  className="mt-4 grid gap-3 sm:grid-cols-2 text-sm"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
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
