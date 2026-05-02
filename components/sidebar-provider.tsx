"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/components/ui/use-mobile"
import { Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface SidebarProviderProps {
  children: React.ReactNode
  user?: any
}

export function SidebarProvider({ children, user }: SidebarProviderProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  // Define public paths where sidebar should never show
  const isPublicPath = pathname === "/" || pathname?.startsWith("/auth/")

  // Only show sidebar if user is logged in AND it's not a public path
  const showSidebar = user && !isPublicPath

  // Close sidebar on route change for mobile
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (!showSidebar) {
    return (
      <div className="flex min-h-screen">
        <main className="flex-1 min-h-screen w-full flex flex-col">
          <div className="flex-1">{children}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 h-full w-64 z-50">
          <Sidebar user={user} />
        </aside>
      )}

      <main
        className={cn(
          "flex-1 min-h-screen w-full transition-all duration-300",
          showSidebar && !isMobile && "ml-64",
          isMobile && "pt-16",
        )}
      >
        {/* Mobile Header */}
        {isMobile && (
          <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-40">
            <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-bold">
                <span className="text-cyan-500">Dev</span>
                <span className="text-orange-500">Board</span>
              </h1>
            </Link>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-slate-200 hover:text-white transition-colors">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-slate-950 border-r border-white/10">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <Sidebar user={user} />
              </SheetContent>
            </Sheet>
          </header>
        )}

        <div className={cn("w-full h-full", isMobile ? "p-4" : "p-4 md:p-8")}>
          {children}
        </div>
      </main>
    </div>
  )
}
