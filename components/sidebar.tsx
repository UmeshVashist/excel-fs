"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, FileText, Keyboard, Settings, LogOut, StickyNote, LinkIcon, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-blue-400",
  },
  {
    name: "Formulas",
    href: "/formulas",
    icon: FileText,
    color: "text-purple-400",
  },
  {
    name: "Shortcuts",
    href: "/shortcuts",
    icon: Keyboard,
    color: "text-orange-400",
  },
  {
    name: "Notes",
    href: "/notes",
    icon: StickyNote,
    color: "text-green-400",
  },
  {
    name: "URLs",
    href: "/urls",
    icon: LinkIcon,
    color: "text-cyan-400",
  },
  {
    name: "Todos",
    href: "/todos",
    icon: CheckSquare,
    color: "text-pink-400",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    color: "text-amber-400",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-950/20 backdrop-blur-sm border-r border-white/10 text-white shadow-sm flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold mb-10">
            <span className="text-cyan-500">Dev</span>
            <span className="text-orange-500">Board</span>
          </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 rounded-3xl px-4 py-3 text-slate-200 hover:text-white hover:bg-white/10 transition-all",
                  isActive && "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-400/30",
                )}
              >
                <item.icon className={cn("h-5 w-5", item.color)} />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="btn-custom btn-custom-red w-full flex items-center justify-start gap-3 px-0"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          Logout
        </button>
      </div>
    </aside>
  )
}
