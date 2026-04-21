import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }

  let supabaseResponse = NextResponse.next()

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user && !request.nextUrl.pathname.startsWith("/auth")) {
    const lastActivity = request.cookies.get("last_activity")?.value

    if (lastActivity) {
      const lastActivityTime = Number.parseInt(lastActivity)
      const timeoutLimit = 30 * 60 * 1000 // 30 minutes
      const now = Date.now()

      if (now - lastActivityTime > timeoutLimit) {
        // Explicitly clear the session and activity cookies
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        url.searchParams.set("timeout", "true")

        const response = NextResponse.redirect(url)
        response.cookies.delete("last_activity")
        // Supabase SSR cookies are handled by setAll, but we should clear them here if possible
        // since we are redirecting away from a state that thinks it has a user.
        return response
      }
    }

    supabaseResponse.cookies.set("last_activity", Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  if (!request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/" && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (
    (request.nextUrl.pathname.startsWith("/auth") || request.nextUrl.pathname === "/") &&
    user &&
    !request.nextUrl.searchParams.has("timeout")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
