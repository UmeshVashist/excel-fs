"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Check, Shield, Lock, Clock } from "lucide-react"

export default function OAuthInfoPage() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent mb-4">
          OAuth Authentication Required
        </h1>
        <p className="text-slate-300 text-lg">
          This application uses Gmail or GitHub for authentication to keep your account secure
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Feature 1 */}
        <Card className="border border-slate-700/50 bg-slate-950/30 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-green-400" />
              <CardTitle className="text-lg text-green-400">Enhanced Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 text-sm">
              Your account is protected by Gmail or GitHub's enterprise-grade security systems, including two-factor authentication support.
            </p>
          </CardContent>
        </Card>

        {/* Feature 2 */}
        <Card className="border border-slate-700/50 bg-slate-950/30 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-6 h-6 text-blue-400" />
              <CardTitle className="text-lg text-blue-400">Account Protection</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 text-sm">
              OAuth eliminates the need to store your password directly, making your account inherently more secure.
            </p>
          </CardContent>
        </Card>

        {/* Feature 3 */}
        <Card className="border border-slate-700/50 bg-slate-950/30 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-purple-400" />
              <CardTitle className="text-lg text-purple-400">Quick Setup</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 text-sm">
              Sign up in seconds with Gmail or GitHub. No complicated registration process needed.
            </p>
          </CardContent>
        </Card>

        {/* Feature 4 */}
        <Card className="border border-slate-700/50 bg-slate-950/30 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Check className="w-6 h-6 text-emerald-400" />
              <CardTitle className="text-lg text-emerald-400">Industry Standard</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 text-sm">
              OAuth is used by leading companies worldwide for secure authentication and data protection.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <Card className="border border-slate-700/50 bg-slate-950/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">How OAuth Works</CardTitle>
            <CardDescription>Simple 3-step process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 font-bold">
                  1
                </div>
                <div className="w-1 h-12 bg-gradient-to-b from-green-500/50 to-transparent" />
              </div>
              <div className="pb-12">
                <h4 className="font-semibold text-slate-200 mb-1">Click Sign Up</h4>
                <p className="text-slate-400 text-sm">
                  Click on Gmail or GitHub button on our sign up page
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 font-bold">
                  2
                </div>
                <div className="w-1 h-12 bg-gradient-to-b from-blue-500/50 to-transparent" />
              </div>
              <div className="pb-12">
                <h4 className="font-semibold text-slate-200 mb-1">Authenticate</h4>
                <p className="text-slate-400 text-sm">
                  Sign in with your Gmail or GitHub account credentials
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 mb-1">Access Dashboard</h4>
                <p className="text-slate-400 text-sm">
                  Set your password and username, then start using the app
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Providers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="border border-slate-700/50 bg-slate-950/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">Supported Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gmail */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 via-yellow-500/10 to-green-500/10 border-none flex items-center gap-3">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 4.5v15c0 .85-.65 1.5-1.5 1.5H21V7.38l-9 6.75-9-6.75V21H1.5c-.85 0-1.5-.65-1.5-1.5v-15c0-.4.15-.75.45-1.05.3-.3.65-.45 1.05-.45H3.38l8.62 6.45L20.62 3H22.5c.4 0 .75.15 1.05.45.3.3.45.65.45 1.05Z" fill="#EA4335"/>
                </svg>
                <div>
                  <p className="font-semibold text-yellow-300">Gmail</p>
                  <p className="text-sm text-slate-400">Powered by Google</p>
                </div>
              </div>

              {/* GitHub */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-gray-700/10 to-gray-900/10 border-none flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.546 2.914 1.186.092-.923.35-1.546.636-1.903-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0110 4.844c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C17.138 18.194 20 14.44 20 10.017 20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-200">GitHub</p>
                  <p className="text-sm text-slate-400">Powered by GitHub</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-2xl flex flex-col md:flex-row gap-4 justify-center"
      >
        <Link href="/auth/sign-up" className="flex-1">
          <Button className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] group flex items-center justify-center gap-2">
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>

        <Link href="/auth/login" className="flex-1">
          <Button
            variant="ghost"
            className="w-full bg-slate-900/40 text-slate-300 hover:text-white py-3 rounded-lg transition-all duration-300"
          >
            Already Have Account?
          </Button>
        </Link>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border border-slate-700/50 bg-slate-950/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-200 mb-1">
                Why is OAuth required?
              </h4>
              <p className="text-slate-400 text-sm">
                OAuth provides enterprise-grade security, eliminates password storage concerns, and gives you the flexibility to use your existing Gmail or GitHub account.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-1">
                Is my data secure?
              </h4>
              <p className="text-slate-400 text-sm">
                Yes. We use OAuth which means we never see your actual password. Your credentials are managed securely by Google or GitHub.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-1">
                Can I use both Gmail and GitHub?
              </h4>
              <p className="text-slate-400 text-sm">
                Currently, each account is tied to one provider. You can create separate accounts with different providers if needed.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-1">
                What if I don't have Gmail or GitHub?
              </h4>
              <p className="text-slate-400 text-sm">
                Both Gmail and GitHub are free to create. Visit <a href="https://gmail.com" className="text-blue-400 hover:underline">gmail.com</a> or <a href="https://github.com" className="text-blue-400 hover:underline">github.com</a> to sign up.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
