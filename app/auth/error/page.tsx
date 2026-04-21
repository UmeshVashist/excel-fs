import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { AlertTriangle, ArrowLeft } from "lucide-react"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94],
          scale: { duration: 0.5 }
        }}
        className="w-full max-w-md"
      >
        <Card className="border border-slate-700/50 bg-slate-950/30 backdrop-blur-xl shadow-2xl shadow-slate-900/50 hover:shadow-slate-900/70 transition-all duration-500 hover:border-slate-600/50 group">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <CardHeader className="text-center pb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-4"
              >
                <AlertTriangle className="w-16 h-16 text-red-400" />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
                Something went wrong
              </CardTitle>
            </CardHeader>
          </motion.div>
          <CardContent className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {params?.error ? (
                <p className="text-sm text-slate-300 bg-slate-800/50 border border-slate-600/50 rounded-lg p-4 leading-relaxed">
                  <span className="text-red-400 font-medium">Error:</span> {params.error}
                </p>
              ) : (
                <p className="text-sm text-slate-300 bg-slate-800/50 border border-slate-600/50 rounded-lg p-4 leading-relaxed">
                  An unspecified error occurred. Please try again or contact support if the problem persists.
                </p>
              )}
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Link href="/auth/login">
                <Button className="w-full bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 hover:from-slate-500 hover:via-slate-600 hover:to-slate-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/25 hover:scale-[1.02] group">
                  <span className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                    Back to Login
                  </span>
                </Button>
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
