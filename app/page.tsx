import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl space-y-12">
        <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-3xl">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-6">
              
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white">
                Build your Excel knowledge with a smarter, glassy workspace.
              </h1>
              <p className="max-w-2xl text-slate-300 text-lg leading-8">
                Save formulas, shortcuts, notes and workflows in one polished dashboard made for power users.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/login">
                  <Button size="lg" className="w-full sm:w-auto bg-cyan-500/20 text-cyan-100 border border-cyan-400/50 hover:bg-cyan-500/30 hover:border-cyan-400 backdrop-blur-sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="lg" className="w-full sm:w-auto bg-slate-950/20 text-white border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-slate-950/40 p-8 shadow-xl shadow-cyan-500/10 backdrop-blur-2xl">
              <div className="space-y-4 text-slate-200">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Overview</p>
                  <p className="mt-3 text-sm text-slate-300">
                    Your dashboard with search, favorites, and a sleek glass interface.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Formulas saved</p>
                    <p className="mt-2 text-2xl font-semibold text-white">142</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Shortcuts added</p>
                    <p className="mt-2 text-2xl font-semibold text-white">68</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Organize formulas",
              description: "Track every Excel formula, example, and note in a single glass dashboard.",
            },
            {
              title: "Smart search",
              description: "Find formulas and shortcuts instantly with intuitive filtering.",
            },
            {
              title: "Personal workspace",
              description: "Keep your most-used items accessible inside a polished UI.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-3xl"
            >
              <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
              <p className="text-slate-300 leading-7">{card.description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
