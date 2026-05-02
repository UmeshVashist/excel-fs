import { Loader2 } from "lucide-react"

export default function RootLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
        <p className="text-slate-400 animate-pulse">Loading DevBoard...</p>
      </div>
    </div>
  )
}
