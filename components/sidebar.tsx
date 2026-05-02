"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, FileText, Keyboard, Settings, LogOut, StickyNote, LinkIcon, CheckSquare, User, UserCircle, Lock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SettingsModals } from "./settings-modals"

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
  // {
  //   name: "Settings",
  //   href: "/settings",
  //   icon: Settings,
  //   color: "text-amber-400",
  // },
]

export function Sidebar({ user }: { user?: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<{ username: string | null; email: string | null; id: string | null } | null>(null)
  const [modalType, setModalType] = useState<"profile" | "password" | "danger" | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchProfile = async () => {
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("username, email, id")
        .eq("id", user.id)
        .single()
      
      if (data) {
        setProfile(data)
      } else {
        setProfile({
          username: user.user_metadata?.username || user.email?.split('@')[0] || "User",
          email: user.email || null,
          id: user.id
        })
      }
    }
  }

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user, supabase])

  useEffect(() => {
    if (!user) return

    // Subscribe to realtime changes for the profile
    const channel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchProfile()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const openModal = (type: "profile" | "password" | "danger") => {
    setModalType(type)
    setIsModalOpen(true)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="h-full w-full bg-slate-950/20 backdrop-blur-sm border-r border-white/10 text-white shadow-sm flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-white/10">
        <Link href="/dashboard" className="block hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold mb-4">
              <span className="text-cyan-500">Dev</span>
              <span className="text-orange-500">Board</span>
          </h1>
        </Link>
        
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 px-1 py-2 mt-2 cursor-pointer hover:bg-white/5 rounded-lg transition-colors group">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-500/50 transition-colors">
                  <User className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-slate-100 truncate">
                    {profile.username}
                  </span>
                  <span className="text-xs text-slate-400 truncate">
                    {profile.email}
                  </span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-slate-200" align="start">
              <DropdownMenuLabel className="text-slate-400 font-normal">Account Settings</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem 
                onClick={() => openModal("profile")}
                className="focus:bg-white/10 focus:text-white cursor-pointer gap-2"
              >
                <UserCircle className="h-4 w-4 text-blue-400" />
                Profile Information
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openModal("password")}
                className="focus:bg-white/10 focus:text-white cursor-pointer gap-2"
              >
                <Lock className="h-4 w-4 text-purple-400" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem 
                onClick={() => openModal("danger")}
                className="focus:bg-red-500/10 focus:text-white cursor-pointer gap-2 "
              >
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Danger Zone
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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

      <SettingsModals 
        type={modalType}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        user={user}
        onUpdate={fetchProfile}
      />
    </div>
  )
}
