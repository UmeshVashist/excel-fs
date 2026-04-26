import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { GlassBackground } from "@/components/glass-background"
import { SidebarProvider } from "@/components/sidebar-provider"
import { createClient } from "@/lib/supabase/server"
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen">
        <GlassBackground>
          <SidebarProvider user={user}>{children}</SidebarProvider>
        </GlassBackground>
        <Analytics />
      </body>
    </html>
  )
}
