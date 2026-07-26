import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
]);

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  },
  (req) => {
    const host = req.nextUrl.host;
    const isLocalhost = host.includes("localhost");
    const rawDomain = isLocalhost ? host : (process.env.NEXT_PUBLIC_CLERK_DOMAIN || "devboard.cashms.in");
    const domain = rawDomain.replace(/^https?:\/\//, "");
    const signInUrl = isLocalhost 
      ? "http://localhost:3000/auth/login" 
      : (process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "https://devtech.cashms.in/auth/login");
    return {
      isSatellite: !isLocalhost || process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true",
      domain,
      satelliteAutoSync: true,
      signInUrl,
    };
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
  ],
};
