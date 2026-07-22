import { SignUp } from "@clerk/nextjs"
import { dark } from "@clerk/themes"

export default function SignUpPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-slate-950/40">
      <SignUp
        appearance={{
          baseTheme: dark,
          elements: {
            card: "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl",
          },
        }}
      />
    </div>
  )
}
