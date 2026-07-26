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

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect()
    }
  },
  (req) => {
    const host = req.nextUrl.host;
    const isLocalhost = host.includes("localhost");
    return {
      isSatellite: process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true",
      domain: isLocalhost ? host : process.env.NEXT_PUBLIC_CLERK_DOMAIN,
      satelliteAutoSync: true,
      signInUrl: isLocalhost 
        ? "http://localhost:3000/auth/login" 
        : process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    };
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
  ],
}
