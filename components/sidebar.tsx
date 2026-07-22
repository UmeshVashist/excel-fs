"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, FileText, Keyboard, Settings, LogOut, StickyNote, LinkIcon, CheckSquare, User, UserCircle, Lock, AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClerk, useUser } from "@clerk/nextjs"
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
import { ChatAssistant } from "./chat-assistant"

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
    name: "Shared with Me",
    href: "/shared",
    icon: UserCircle,
    color: "text-indigo-400",
  },
]

export function Sidebar({ user }: { user?: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useClerk()
  const { user: clerkUser } = useUser()
  const supabase = createClient()
  const [profile, setProfile] = useState<{ username: string | null; email: string | null; id: string | null } | null>(null)
  const [modalType, setModalType] = useState<"profile" | "password" | "danger" | "recycle-bin" | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const currentUserData = user || (clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || null,
    user_metadata: { username: clerkUser.username || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || "User" }
  } : null)

  const fetchProfile = async () => {
    if (currentUserData) {
      const { data } = await supabase
        .from("profiles")
        .select("username, email, id")
        .eq("id", currentUserData.id)
        .single()
      
      if (data) {
        setProfile(data)
      } else {
        setProfile({
          username: currentUserData.user_metadata?.username || currentUserData.email?.split('@')[0] || "User",
          email: currentUserData.email || null,
          id: currentUserData.id
        })
      }
    }
  }

  useEffect(() => {
    if (currentUserData) {
      fetchProfile()
    }
  }, [currentUserData?.id, supabase])

  useEffect(() => {
    if (!currentUserData) return

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
  }, [supabase, currentUserData?.id])

  const openModal = (type: "profile" | "password" | "danger" | "recycle-bin") => {
    setModalType(type)
    setIsModalOpen(true)
  }

  const handleLogout = async () => {
    await signOut({ redirectUrl: "https://dev-tech-hub.vercel.app" })
  }

  return (
    <div className="h-full w-full bg-slate-950/20 backdrop-blur-sm border-r border-white/10 text-white shadow-sm flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-white/10">
        <a href="https://dev-tech-hub.vercel.app/dashboard" className="block hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold mb-4">
              <span className="text-cyan-500">Dev</span>
              <span className="text-orange-500">Board</span>
          </h1>
        </a>
        
        {profile && (
          <DropdownMenu>
             <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 px-1 py-2 mt-2 cursor-pointer hover:bg-white/5 rounded-lg transition-colors group">
                <div className="relative overflow-hidden rounded-full p-[1.5px] w-10 h-10 shrink-0">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square rounded-full bg-[conic-gradient(from_0deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] animate-[border-spin_6s_linear_infinite] z-0 pointer-events-none" />
                  <div className="relative z-10 w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                    <User className="h-5 w-5 text-cyan-400" />
                  </div>
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
            <DropdownMenuContent className="w-56 bg-slate-900/85 backdrop-blur-xl border-white/15 text-slate-100 shadow-2xl" align="start">
              <DropdownMenuLabel className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Account Settings</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => openModal("profile")}
                className="focus:bg-white/15 focus:text-white cursor-pointer gap-2"
              >
                <UserCircle className="h-4 w-4 text-blue-400" />
                Profile Information
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openModal("password")}
                className="focus:bg-white/15 focus:text-white cursor-pointer gap-2"
              >
                <Lock className="h-4 w-4 text-purple-400" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openModal("recycle-bin")}
                className="focus:bg-white/15 focus:text-white cursor-pointer gap-2"
              >
                <Trash2 className="h-4 w-4 text-orange-400" />
                Recycle Bin
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => openModal("danger")}
                className="focus:bg-red-500/20 focus:text-red-300 text-red-400 cursor-pointer gap-2"
              >
                <AlertTriangle className="h-4 w-4 text-red-400" />
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
            <Link key={item.href} href={item.href} className="block w-full">
              {isActive ? (
                <div className="relative overflow-hidden rounded-3xl p-[1.5px] w-full">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square rounded-full bg-[conic-gradient(from_0deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] animate-[border-spin_6s_linear_infinite] z-0 pointer-events-none" />
                  <button
                    className="relative z-10 w-full flex items-center justify-start gap-3 rounded-3xl px-4 py-3 bg-slate-950 text-white font-semibold border border-white/10 outline-none transition-all cursor-pointer"
                  >
                    <item.icon className={cn("h-5 w-5", item.color)} />
                    {item.name}
                  </button>
                </div>
              ) : (
                <button
                  className="w-full flex items-center justify-start gap-3 rounded-3xl px-4 py-3 text-slate-200 hover:text-white hover:bg-white/10 outline-none transition-all cursor-pointer"
                >
                  <item.icon className={cn("h-5 w-5", item.color)} />
                  {item.name}
                </button>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Robot AI Chat Assistant Trigger & Drawer */}
      <div className="flex justify-center py-2 mb-4 shrink-0">
        <ChatAssistant userId={user?.id} />
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="relative overflow-hidden rounded-xl p-[1.5px] w-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square rounded-full bg-[conic-gradient(from_0deg,#ef4444,#b91c1c,#991b1b,#ef4444)] animate-[border-spin_6s_linear_infinite] z-0 pointer-events-none" />
          <button
            onClick={handleLogout}
            className="relative z-10 w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl bg-slate-950 text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
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
