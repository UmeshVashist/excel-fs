"use client"

import { SignIn } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { motion } from "framer-motion"

export default function LoginPage() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="w-full flex justify-center"
      >
        <SignIn
          path="/auth/login"
          routing="path"
          signUpUrl="/auth/sign-up"
          forceRedirectUrl="/dashboard"
          appearance={{
            baseTheme: dark,
            elements: {
              card: "bg-slate-950/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-slate-900/50",
            },
          }}
        />
      </motion.div>
    </div>
  )
}
