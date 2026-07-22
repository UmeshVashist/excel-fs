import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider } from "@clerk/nextjs"
import { currentUser } from "@clerk/nextjs/server"
import "./globals.css"
import { GlassBackground } from "@/components/glass-background"
import { SidebarProvider } from "@/components/sidebar-provider"
import { AuthMonitor } from "@/components/auth-monitor"
import { getURL } from "@/lib/utils"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: "DevBoard",
  description: "Created by Excel F&S team",
  generator: "E-FS",
  icons: {
    icon: [
      {
        url: "https://jxechgirxrbrblyrrqmt.supabase.co/storage/v1/object/public/images/bb5b5ced-6b47-425c-aad2-065017342a96/1768574759761-development.png",
      },
    ],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const clerkUser = await currentUser()
  
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || null,
    user_metadata: {
      username: clerkUser.username || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || "User",
    }
  } : null

  return (
    <ClerkProvider afterSignOutUrl={`${process.env.NEXT_PUBLIC_LAUNCHER_URL || "http://localhost:3000"}/auth/login`}>
      <html lang="en">
        <body className="font-sans antialiased min-h-screen">
          <GlassBackground>
            <AuthMonitor />
            <SidebarProvider user={user}>{children}</SidebarProvider>
          </GlassBackground>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
