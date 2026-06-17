"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { motion } from "framer-motion"
import { AlertCircle, ArrowRight, Lock, Github } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function UnauthorizedPage() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
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
        <Card className="border border-yellow-700/50 bg-slate-950/30 backdrop-blur-xl shadow-2xl shadow-slate-900/50 hover:shadow-slate-900/70 transition-all duration-500 hover:border-yellow-600/50 group">
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
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-br from-yellow-500/20 to-red-500/20 border border-yellow-500/30">
                    <Lock className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                  Access Restricted
                </CardTitle>
              </motion.div>
              <CardDescription className="text-slate-300 text-lg">
                This area requires Gmail or GitHub authentication
              </CardDescription>
            </CardHeader>
          </motion.div>

          <CardContent>
            <motion.div
              className="flex flex-col gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {/* Alert Box */}
              <motion.div
                className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex gap-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold mb-1">Your account is not authorized</p>
                  <p>Dashboard access is restricted to users who signed up with Gmail or GitHub.</p>
                </div>
              </motion.div>

              {/* Info Box */}
              <motion.div
                className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <p className="text-sm text-blue-300 mb-3 font-semibold">
                  ✓ What you need to do:
                </p>
                <ul className="text-sm text-blue-200 space-y-2">
                  <li>• Sign out of your current account</li>
                  <li>• Create a new account with Gmail</li>
                  <li>• Or create a new account with GitHub</li>
                  <li>• Set your password and username</li>
                </ul>
              </motion.div>

              {/* Buttons */}
              <motion.div
                className="flex flex-col gap-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
              >
                <Button
                  onClick={handleLogout}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 hover:scale-[1.02] group"
                >
                  <span>Sign Out</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Link href="/auth/sign-up" className="w-full">
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02]"
                  >
                    Create New Account
                  </Button>
                </Link>

                <Link href="/auth/login" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-slate-600/50 text-slate-300 hover:text-white py-3 rounded-lg transition-all duration-300"
                  >
                    Back to Login
                  </Button>
                </Link>
              </motion.div>

              {/* Additional Info */}
              <motion.div
                className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              >
                <p className="text-xs text-slate-400 text-center">
                  💡 <span className="text-slate-300">Supported OAuth providers:</span> Gmail & GitHub
                </p>
                <div className="flex gap-2 justify-center mt-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="4" width="4" height="10" fill="#EA4335" rx="0.5"/>
                      <rect x="7" y="4" width="4" height="10" fill="#4285F4" rx="0.5"/>
                      <rect x="12" y="4" width="4" height="10" fill="#FBBC05" rx="0.5"/>
                      <rect x="17" y="4" width="4" height="10" fill="#4285F4" rx="0.5"/>
                      <polygon points="2,14 6,17 12,12 18,17 22,14 12,22" fill="#34A853"/>
                    </svg>
                    <span className="text-xs text-slate-300">Gmail</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700/20 border border-gray-600/50">
                    <Github className="w-4 h-4 text-gray-300" />
                    <span className="text-xs text-slate-300">GitHub</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
