import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/auth/login(.*)",
  "/auth/sign-up(.*)",
  "/auth/forgot-password(.*)",
  "/auth/reset-password(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/(.*)",
  "/__clerk/(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  console.log("DevBoard Middleware executing for path:", req.nextUrl.pathname);
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
  ],
}
