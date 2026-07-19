"use client"

import type React from "react"

export function GlassBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#FAEBD7] text-slate-900 theme-neomorphic-glass">
      <div className="relative z-10">{children}</div>
    </div>
  )
}
