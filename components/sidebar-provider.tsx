"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { cn } from "@/lib/utils"

interface SidebarProviderProps {
  children: React.ReactNode
  user?: any
}

export function SidebarProvider({ children, user }: SidebarProviderProps) {
  const pathname = usePathname()

  // Define public paths where sidebar should never show
  const isPublicPath = pathname === "/" || pathname?.startsWith("/auth/")

  // Only show sidebar if user is logged in AND it's not a public path
  const showSidebar = user && !isPublicPath

  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <main
        className={cn(
          "flex-1 min-h-screen w-full transition-all duration-300",
          showSidebar && "ml-64",
          !showSidebar && "flex flex-col",
        )}
      >
        <div className={cn("w-full h-full", showSidebar ? "p-4 md:p-8" : "flex-1")}>{children}</div>
      </main>
    </div>
  )
}
