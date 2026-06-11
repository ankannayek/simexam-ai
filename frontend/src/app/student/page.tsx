"use client"

import { useEffect, useState } from "react"
import { ArrowRight, LogOut, Search, BookOpen, PenTool } from "lucide-react"
import { navigateTo } from "../../lib/navigation"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { getUser, logout, isAuthenticated, AuthUser } from "../../lib/auth"

export default function StudentHub() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [inputValue, setInputValue] = useState("")
  
  useEffect(() => {
    if (!isAuthenticated()) {
      navigateTo("/login")
      return
    }
    const currentUser = getUser()
    if (currentUser?.role === "admin") {
       navigateTo(`/${currentUser.orgSlug}/admin`)
       return
    }
    setUser(currentUser)
  }, [])

  if (!user) return null

  function handleAction(type: "exam" | "learn") {
    if (!inputValue.trim()) return
    
    // Store their intent so the workspace knows what mode to boot in
    sessionStorage.setItem("simexam_hub_intent", type)
    sessionStorage.setItem("simexam_hub_query", inputValue)
    
    // Navigate to the intake/setup wizard
    navigateTo(`/${user?.orgSlug || "demo"}/intake`)
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-zinc-100 font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,131,255,0.08),transparent_40%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.5),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6">
        {/* Minimal Header */}
        <nav className="flex items-center justify-between py-6">
          <span className="text-xl font-semibold tracking-tight text-zinc-50">SimExam</span>
          <button 
            onClick={logout}
            className="flex items-center text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-200"
          >
            Sign out <LogOut size={14} className="ml-2" />
          </button>
        </nav>

        {/* Centered Hub Content */}
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center animate-fade-up">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            What would you like to do?
          </h1>
          <p className="mt-4 max-w-md text-base text-zinc-400">
            Enter an assessment code to take a test, or type a topic to start an interactive learning session.
          </p>

          {/* Central Input Hub */}
          <div className="mt-10 w-full max-w-xl space-y-4">
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g., 'TEST-8X92' or 'Learn System Design'"
                className="w-full rounded-2xl border border-white/10 bg-surface-raised/50 py-4 pl-12 pr-4 text-base text-zinc-100 shadow-sm backdrop-blur-md transition-all placeholder:text-zinc-600 focus:border-accent/50 focus:bg-surface-raised focus:outline-none focus:ring-4 focus:ring-accent/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleAction("exam")}
                disabled={!inputValue.trim()}
                className="h-12 w-full rounded-xl bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              >
                <PenTool size={16} className="mr-2" />
                Join Assessment
              </Button>
              <Button 
                onClick={() => handleAction("learn")}
                disabled={!inputValue.trim()}
                variant="outline"
                className="h-12 w-full rounded-xl border-white/10 bg-surface-raised hover:bg-white/5"
              >
                <BookOpen size={16} className="mr-2 text-accent" />
                Start Learning
              </Button>
            </div>
          </div>

          {/* Quick Stats / History (Minimalistic) */}
          <div className="mt-24 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="border-white/5 bg-transparent shadow-none">
              <CardContent className="p-6 text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Recent Activity</div>
                <div className="mt-3 text-sm text-zinc-400">No recent sessions found.</div>
              </CardContent>
            </Card>
            <Card className="border-white/5 bg-transparent shadow-none">
              <CardContent className="p-6 text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Suggested Topics</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/10" onClick={() => setInputValue("React Hooks")}>React Hooks</span>
                  <span className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/10" onClick={() => setInputValue("Microservices")}>Microservices</span>
                  <span className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/10" onClick={() => setInputValue("API Design")}>API Design</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </main>
  )
}
