"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { Lightfall } from "./lightfall"

export function GlassBackground({ children }: { children: React.ReactNode }) {
  const glowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${event.clientX - 140}px, ${event.clientY - 140}px)`
      }
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Lightfall
          colors={['#A6C8FF', '#5227FF', '#FF9FFC']}
          backgroundColor="#0A29FF"
          speed={0.5}
          streakCount={2}
          streakWidth={1}
          streakLength={1}
          glow={1}
          density={0.6}
          twinkle={1}
          zoom={3}
          backgroundGlow={0.5}
          opacity={1}
          mouseInteraction
          mouseStrength={0.5}
          mouseRadius={1}
          // Extra color props from example snippet
          mixBlendMode={undefined}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_25%),radial-gradient(circle_at_70%_30%,_rgba(59,130,246,0.1),_transparent_16%)] z-1" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.65),rgba(15,23,42,0.45))] z-1" />
      <div
        ref={glowRef}
        className="pointer-events-none fixed w-[280px] h-[280px] rounded-full bg-cyan-400/20 blur-3xl opacity-90 transition-transform duration-200 z-3"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
