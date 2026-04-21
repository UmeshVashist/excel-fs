"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
      setSuccess(true)
    } catch (error: any) {
      setError(error.message || "An error occurred")
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
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-2">
                  Reset Password
                </CardTitle>
              </motion.div>
              <CardDescription className="text-cyan-400/80 text-lg">
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
          </motion.div>
          <CardContent>
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                    className="flex flex-col items-center text-center space-y-4"
                  >
                    <CheckCircle className="w-16 h-16 text-green-400" />
                    <p className="text-green-400 font-semibold text-lg">Check your email!</p>
                    <p className="text-sm text-slate-300">
                      We've sent a password reset link to <span className="text-cyan-400 font-medium">{email}</span>
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <Link
                      href="/auth/login"
                      className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-600/50 bg-slate-900/40 text-slate-300 transition-all duration-300 hover:bg-slate-800/60 hover:text-blue-400 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10 backdrop-blur-sm font-semibold"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Link>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <form onSubmit={handleReset} className="space-y-6">
                    <motion.div
                      className="grid gap-2"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                    >
                      <Label htmlFor="email" className="text-slate-300 font-medium flex items-center gap-2">
                        <Mail size={16} className="text-slate-400" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        placeholder="Enter your email address"
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all duration-300 hover:border-slate-500/50 pl-10"
                      />
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
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                      >
                        {isLoading ? (
                          <motion.div
                            className="flex items-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </motion.div>
                        ) : (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                          >
                            Send Reset Link
                          </motion.span>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                  <motion.div
                    className="grid gap-3 sm:grid-cols-2 items-center justify-center text-sm"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                  >
                    <Link
                      href="/auth/login"
                      className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-600/50 bg-slate-900/40 text-slate-300 transition-all duration-300 hover:bg-slate-800/60 hover:text-blue-400 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10 backdrop-blur-sm font-semibold"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
