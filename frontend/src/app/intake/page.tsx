"use client"

import { useState } from "react"
import { ArrowRight, BrainCircuit, ShieldAlert, Sparkles } from "lucide-react"
import { navigateTo } from "../../lib/navigation"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { useParams } from "react-router-dom"
import { SESSION_KEYS } from "../../lib/constants"
import { getUser } from "../../lib/auth"

export default function IntakePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const user = getUser()
  const [focusArea, setFocusArea] = useState("")
  const [experience, setExperience] = useState("")

  function handleStart() {
    // Store constraints in session to be picked up by the workspace
    sessionStorage.setItem("simexam_intake_focus", focusArea)
    sessionStorage.setItem("simexam_intake_experience", experience)
    navigateTo(`/${orgSlug || user?.orgSlug || "demo"}/exam`)
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 font-sans text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,131,255,0.12),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.05),transparent_20%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.5),transparent_35%)]" />

      <div className="relative z-10 w-full max-w-2xl space-y-8 animate-fade-up">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
            <BrainCircuit size={24} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">Module Setup</h1>
          <p className="mx-auto max-w-md text-base leading-relaxed text-zinc-400">
            Before we enter the workspace, let's tailor the AI's constraints to your domain.
          </p>
        </div>

        <Card className="border-white/10 bg-surface-raised/80 backdrop-blur-md overflow-hidden">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-200">What is your primary focus for this module?</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {["Frontend & UI", "Backend & APIs", "System Architecture"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFocusArea(opt)}
                    className={`flex items-center justify-center rounded-xl border p-4 text-sm transition-all ${
                      focusArea === opt 
                        ? "border-accent bg-accent/10 text-accent font-medium shadow-[0_0_15px_rgba(124,131,255,0.2)]" 
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-200">How would you rate your experience level?</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {["Junior", "Mid-Level", "Senior"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setExperience(opt)}
                    className={`flex items-center justify-center rounded-xl border p-4 text-sm transition-all ${
                      experience === opt 
                        ? "border-accent bg-accent/10 text-accent font-medium shadow-[0_0_15px_rgba(124,131,255,0.2)]" 
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-white/10">
               <div className="flex items-center text-xs text-zinc-500">
                  <ShieldAlert size={14} className="mr-2" />
                  The AI mentor will adjust its rubric based on your selections.
               </div>
               <Button 
                 onClick={handleStart} 
                 disabled={!focusArea || !experience}
                 className="h-11 px-6 rounded-xl"
               >
                 Enter Workspace <ArrowRight size={16} />
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
